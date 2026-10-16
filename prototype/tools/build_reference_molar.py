"""Build an editable, reference-informed 3-root study molar and browser-ready GLB.

Run from anywhere: blender -b -t 4 --python prototype/tools/build_reference_molar.py
The user-supplied JPG views guide proportions only; they are not 3D scan data.
"""
from pathlib import Path
import bpy
import math
from mathutils import Vector

OUT = Path(__file__).resolve().parents[1] / 'assets' / 'tooth3d'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene

def material(name, color, roughness, coat):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    p = mat.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Coat Weight'].default_value = coat
    p.inputs['Coat Roughness'].default_value = .12
    return mat

enamel = material('Warm pearlescent enamel', (.91, .87, .79), .19, .8)
cementum = material('Ivory root cementum', (.69, .62, .51), .4, .15)

def ring_mesh(name, rings):
    count = len(rings[0]); vertices = [v for ring in rings for v in ring]
    faces = []
    for row in range(len(rings)-1):
        for i in range(count):
            nxt = (i+1) % count
            faces.append((row*count+i, row*count+nxt, (row+1)*count+nxt, (row+1)*count+i))
    faces.append(tuple(reversed(range(count))))
    faces.append(tuple((len(rings)-1)*count+i for i in range(count)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    for poly in mesh.polygons: poly.use_smooth = True
    return obj

N = 160
def crown_rings():
    rings = []
    profile = [(-.36,.69),(-.25,.79),(-.10,.88),(.11,.98),(.34,1.04),(.55,1.04),(.66,.99),(.73,.92)]
    for z,r in profile:
        rings.append([(r*math.cos(a), .94*r*math.sin(a), z+.015*math.cos(4*a+.3)*(1 if z<.7 else 0)) for a in (i*2*math.pi/N for i in range(N))])
    # The occlusal surface is sculpted as four lobes divided by crossing fissures.
    for j in range(1,55):
        r = 1-j/54
        ring = []
        for i in range(N):
            a = i*2*math.pi/N
            x,y=r*math.cos(a),r*math.sin(a)
            peaks=max(math.exp(-((x-.56*math.cos(k*math.pi/2+math.pi/4))**2+(y-.56*math.sin(k*math.pi/2+math.pi/4))**2)/(2*.34**2)) for k in range(4))
            cusp=.48*peaks*(1-r)**.34
            groove=.10*math.exp(-(r/.33)**2)
            z=.73-.09*(1-r)+cusp-groove
            ring.append((.92*r*math.cos(a), .87*r*math.sin(a), z))
        rings.append(ring)
    return rings

parts = [ring_mesh('Four-cusp molar crown', crown_rings())]
for index,(x0,y0,dx,dy) in enumerate([(-.43,-.18,-.30,-.08),(.0,.27,.015,.18),(.43,-.18,.29,-.08)]):
    rings=[]
    for j in range(57):
        t=j/56
        z=-.23-1.55*t
        x=x0+dx*(t**1.35)
        y=y0+dy*(t**1.4)
        rx=.335*(1-t)**.84+.025
        ry=.275*(1-t)**.87+.023
        rings.append([(x+rx*math.cos(a)*(1+.028*math.cos(3*a)), y+ry*math.sin(a), z) for a in (i*2*math.pi/N for i in range(N))])
    parts.append(ring_mesh(f'Root {index+1}', rings))

# Fuse the visible crown and three roots into one continuous physical surface.
bpy.ops.object.select_all(action='DESELECT')
for p in parts: p.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.object.join()
tooth=parts[0];tooth.name='Dental Expert | three-root study molar'
tooth.data.remesh_voxel_size=.022
bpy.ops.object.voxel_remesh()
smooth=tooth.modifiers.new('Soft organic transitions','SMOOTH')
smooth.factor=.75;smooth.iterations=3
bpy.ops.object.modifier_apply(modifier=smooth.name)
for p in tooth.data.polygons:p.use_smooth=True
tooth.data.materials.clear();tooth.data.materials.append(enamel);tooth.data.materials.append(cementum)
for p in tooth.data.polygons:
    center=p.center
    border=-.27+.025*math.sin(9*center.x)+.02*math.cos(7*center.y)
    p.material_index=0 if center.z>border else 1

# Clean source scene and GLB. Keep only the tooth selected for GLB export.
bpy.ops.object.select_all(action='DESELECT');tooth.select_set(True);bpy.context.view_layer.objects.active=tooth
bpy.ops.export_scene.gltf(filepath=str(OUT/'reference-molar.glb'),export_format='GLB',use_selection=True,export_apply=True)

scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=False
scene.render.resolution_x=1200;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG'
scene.view_settings.view_transform='AgX'
scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.75,.87,.92,1)
scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.6
def light(name,location,power,color,size):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.location=location
    obj.rotation_euler=(Vector((0,0,-.15))-obj.location).to_track_quat('-Z','Y').to_euler()
light('Ivory softbox',(-3,-4,5),750,(1,1,1),5)
light('Warm softbox',(3,-2,2),350,(1,.94,.87),3)
light('Aqua rim',(2,3,3),600,(.55,.9,1),4)
cam_data=bpy.data.cameras.new('Product camera')
cam=bpy.data.objects.new('Product camera',cam_data);bpy.context.collection.objects.link(cam)
cam.location=(3,-6,1.15);cam.rotation_euler=(Vector((0,0,-.23))-cam.location).to_track_quat('-Z','Y').to_euler()
cam_data.type='ORTHO';cam_data.ortho_scale=3.9;scene.camera=cam
scene.render.filepath=str(OUT/'reference-molar-render.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'reference-molar.blend'))
print('Created reference-informed GLB, Blender scene and render in',OUT)
