"""Original procedural molar scene. Run: blender -b -t 4 --python tools/create_tooth_asset.py"""
import bpy, math
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'tooth3d'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=32
scene.cycles.use_denoising=False
scene.render.resolution_x=1100;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
scene.world.color=(.58,.76,.82)
scene.world.use_nodes=True
bg=scene.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.72,.86,.92,1);bg.inputs['Strength'].default_value=.62
scene.view_settings.view_transform='AgX'

def material(name,rgba,rough=.25,coat=.0,sub=.0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*rgba,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*rgba,1);p.inputs['Roughness'].default_value=rough
 p.inputs['Coat Weight'].default_value=coat;p.inputs['Coat Roughness'].default_value=.08
 p.inputs['Subsurface Weight'].default_value=sub;p.inputs['Subsurface Radius'].default_value=(1,.5,.25)
 return m
ENAMEL=material('Lustrous ivory enamel',(.87,.91,.91),.16,.82,.09)
ROOT_MAT=material('Warm translucent root cementum',(.78,.72,.61),.3,.32,.12)
CUT=material('Enamel cross-section',(.94,.89,.78),.3,.3)
DENTIN=material('Warm dentin',(.76,.52,.29),.36,.18,.1)
PULP=material('Living pulp',(.65,.19,.19),.28,.35,.16)
VESSEL=material('Deep red vessel',(.55,.055,.075),.21,.5)
BLUE=material('Blue vessel',(.035,.23,.47),.23,.35)
TEAL=material('Glowing turquoise orbit',(.02,.75,.83),.17,.6)

def mesh(name,vertices,faces,mat):
 data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
 obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat)
 for p in data.polygons:p.use_smooth=True
 return obj

def ring_mesh(name,rings,mat):
 vertices=[];faces=[];N=len(rings[0]);R=len(rings)
 for ring in rings:vertices.extend(ring)
 for j in range(R-1):
  for i in range(N):
   k=(i+1)%N;faces.append((j*N+i,j*N+k,(j+1)*N+k,(j+1)*N+i))
 faces.append(tuple(reversed(tuple(range(N)))))
 faces.append(tuple((R-1)*N+i for i in range(N)))
 return mesh(name,vertices,faces,mat)

S=128
profile=[(-.43,.61),(-.36,.68),(-.27,.76),(-.1,.85),(.12,.95),(.34,1.02),(.55,1.025),(.72,.96),(.85,.84),(.9,.67),(.88,.49),(.81,.31),(.76,.16),(.75,.015)]
rings=[]
for j,(y,r) in enumerate(profile):
 ring=[]
 for i in range(S):
  a=i*2*math.pi/S
  radius=r*(1+.025*math.cos(4*a+.3)+.009*math.cos(8*a))
  cusp=max(0,min(1,(j-5)/5))*(.065*math.cos(4*a+.3)+.012*math.cos(8*a))
  ring.append((.99*radius*math.cos(a),y+cusp,.83*radius*math.sin(a)))
 rings.append(ring)
crown=ring_mesh('Four-cusp sculpted enamel crown',rings,ENAMEL)
for side in [-1,1]:
 rings=[]
 for j in range(49):
  t=j/48;y=-.34-1.53*t
  x=side*(.34+.2*t+.06*math.sin(math.pi*t))
  rx=.36*(1-t)**.72+.008;rz=.30*(1-t)**.8+.008
  rings.append([(x+rx*math.cos(i*2*math.pi/S),y,rz*math.sin(i*2*math.pi/S)+.025*math.sin(math.pi*t)) for i in range(S)])
 ring_mesh(('Mesial' if side<0 else 'Distal')+' sculpted root',rings,ROOT_MAT)

# Sectional dental tissue remains genuine geometry. It is displayed on a separate
# anatomy render; the app's browser model supplies the drag, rotate and layer controls.
def shape(name,points,depth,mat):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='2D';curve.resolution_u=24;curve.fill_mode='BOTH';curve.extrude=depth;curve.bevel_depth=.012;curve.bevel_resolution=3
 spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
 for bp,(x,y) in zip(spline.bezier_points,points):bp.co=(x,y,0);bp.handle_left_type='AUTO';bp.handle_right_type='AUTO'
 spline.use_cyclic_u=True
 obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat)
 # Curve is created in XY and rotated into the front-facing XY plane.
 obj.location.z=.055
 return obj
section=[]
section.append(shape('Enamel cut face',[(-.82,-.27),(-.88,.22),(-.79,.67),(-.48,.83),(-.19,.76),(0,.84),(.28,.77),(.62,.84),(.86,.59),(.89,.2),(.79,-.28)],.016,CUT))
section.append(shape('Dentin cut face',[(-.68,-.24),(-.72,.19),(-.6,.56),(-.35,.64),(0,.56),(.36,.65),(.63,.57),(.73,.18),(.65,-.24)],.022,DENTIN))
neck=shape('Dentin neck and root bifurcation',[(-.65,-.28),(-.61,-.43),(-.42,-.52),(-.17,-.48),(0,-.38),(.17,-.48),(.42,-.52),(.61,-.43),(.65,-.28)],.014,DENTIN)
neck.location.z=.095;section.append(neck)
section.append(shape('Pulp chamber',[(-.28,-.22),(-.33,.11),(-.28,.39),(-.1,.48),(0,.39),(.14,.47),(.32,.35),(.33,.08),(.27,-.22)],.028,PULP))
for side in [-1,1]:
 x=side*.38
 section.append(shape('Root dentin '+str(side),[(x-.18,-.22),(x-.21,-.55),(x-side*.08,-1.12),(x+side*.1,-1.73),(x+side*.18,-1.55),(x+.15,-.8),(x+.17,-.24)],.022,DENTIN))

def tube(name,pts,radius,mat):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=24;curve.bevel_depth=radius;curve.bevel_resolution=4
 spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(pts)-1)
 for bp,p in zip(spline.bezier_points,pts):bp.co=p;bp.handle_left_type='AUTO';bp.handle_right_type='AUTO'
 obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat)
 return obj
for side in [-1,1]:
 x=side*.38
 section.append(tube('Root canal '+str(side),[(x,-.25,.11),(x+side*.02,-.7,.11),(x+side*.08,-1.2,.11),(x+side*.13,-1.65,.11)],.024,VESSEL))
 section.append(tube('Root venule '+str(side),[(x+side*.05,-.35,.12),(x+side*.09,-.86,.12),(x+side*.16,-1.5,.12)],.01,BLUE))
 section[-2].location.z=.13;section[-1].location.z=.13
section.append(tube('Pulp neurovascular bundle',[(0,-.3,.12),(.02,0,.12),(-.05,.37,.12)],.029,VESSEL))
section.append(tube('Pulp vein',[(.05,-.22,.13),(.12,.06,.13),(.2,.35,.13)],.012,BLUE))

# A pair of luminous physical glass rings creates the reference's orbital composition.
orbits=[]
for radius,tilt,thickness in [(1.25,(.56,.2,.35),.024),(1.42,(1.05,-.23,-.18),.009)]:
 bpy.ops.mesh.primitive_torus_add(major_radius=radius,minor_radius=thickness,major_segments=128,minor_segments=12,location=(0,-.29,0))
 orbit=bpy.context.object;orbit.name='Turquoise orbital glass';orbit.rotation_euler=tilt;orbit.data.materials.append(TEAL);orbits.append(orbit)
 for face in orbit.data.polygons:face.use_smooth=True

# The procedural surface uses Y as its vertical axis. Rotate the complete asset
# into Blender's Z-up coordinate system before lighting and exporting.
rig=bpy.data.objects.new('Tooth asset · Z up',None);bpy.context.collection.objects.link(rig)
for obj in list(bpy.context.scene.objects):
 if obj.type in {'MESH','CURVE'}:obj.parent=rig
rig.rotation_euler.x=math.pi/2

# Studio backdrop and large softboxes produce actual glossy reflections.
def area(name,loc,power,color,size):
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape='DISK';data.size=size
 obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.location=loc;obj.rotation_euler=(Vector((0,-.2,0))-obj.location).to_track_quat('-Z','Y').to_euler()
area('Large porcelain softbox',(-3,-5,5),750,(1,1,1),5)
area('Warm vertical strip',(3,-4,1),380,(1,.92,.82),3)
area('Aqua rim',(2,3,2),650,(.45,.91,1),4)
area('Low fill',(-3,-3,-2),190,(.72,.9,1),3)
cam_data=bpy.data.cameras.new('Product camera');cam=bpy.data.objects.new('Product camera',cam_data);bpy.context.collection.objects.link(cam);scene.camera=cam
cam.location=(1.2,-6.8,1.05);cam.rotation_euler=(Vector((0,0,-.27))-cam.location).to_track_quat('-Z','Y').to_euler();cam_data.type='ORTHO';cam_data.ortho_scale=3.8
for obj in section:obj.hide_render=True
scene.render.filepath=str(OUT/'hero.png');bpy.ops.render.render(write_still=True)
# Remove the front half of the physical tooth for the anatomy view. A Boolean
# gives a genuine cut rather than a painted section over a whole tooth.
bpy.ops.mesh.primitive_cube_add(size=2)
cutter=bpy.context.object;cutter.name='Anatomy section cutter';cutter.parent=rig
cutter.location=(0,0,2.52);cutter.scale=(3,3,2.5)
bpy.context.view_layer.update()
for obj in [crown]+[o for o in bpy.context.scene.objects if o.name.endswith('sculpted root')]:
 mod=obj.modifiers.new('Physical sagittal section','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
 bpy.ops.object.modifier_apply(modifier=mod.name)
cutter.hide_render=True
for obj in section:obj.hide_render=False
for obj in orbits:obj.hide_render=True
cam.location=(.35,-7.2,.2);cam.rotation_euler=(Vector((0,0,-.36))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(OUT/'anatomy.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'DentalExpert_Tooth.blend'))
print('Saved original 3D model and two renders to',OUT)
