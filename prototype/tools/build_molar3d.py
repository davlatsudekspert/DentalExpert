"""Procedural upper molar (3 roots) built from scratch for the 3D atlas. Units are millimetres.

One implicit surface drives everything, so the exterior and the cutaway always agree (3 roots outside, 3 canals inside):
  enamel shell  = crown part between the outer surface and an inward offset (thick on cusps, 0 at the cemento-enamel junction)
  dentin        = everything deeper, with the pulp cavity removed
  pulp          = chamber (a shrunken copy of the crown, so horns sit under the cusps) + one canal per root

Output: assets/tooth3d/molar3d/{enamel,dentin,pulp}.glb (closed, non-overlapping solids with vertex colours) and a JSON with the section data.
Usage: python3 tools/build_molar3d.py [--spacing 0.12]
"""
from pathlib import Path
import json, sys
import numpy as np
from scipy.ndimage import gaussian_filter, map_coordinates
from scipy.interpolate import PchipInterpolator, CubicSpline
from skimage.measure import marching_cubes
import trimesh
import fast_simplification

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/tooth3d/molar3d'
SP = float(sys.argv[sys.argv.index('--spacing') + 1]) if '--spacing' in sys.argv else 0.12
rng = np.random.default_rng(7)

# ---- grid: x mesio-distal (mesial = -x), y vertical (occlusal = +y), z bucco-palatal (buccal = +z, faces the camera)
X0, X1, Y0, Y1, Z0, Z1 = -8.2, 8.2, -16.2, 9.0, -9.0, 8.2
xs = np.arange(X0, X1, SP, dtype=np.float32)
ys = np.arange(Y0, Y1, SP, dtype=np.float32)
zs = np.arange(Z0, Z1, SP, dtype=np.float32)
X, Y, Z = np.meshgrid(xs, ys, zs, indexing='ij')
print('grid', X.shape, f'{X.size/1e6:.1f}M voxels')


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


# ---- crown outer section: a rounded rhomboid whose size follows the height (neck narrow, bulge, narrower occlusal table)
ky = [-0.6, 0.0, 1.0, 2.2, 3.6, 5.0, 6.4, 7.6]
ka = [3.9, 4.35, 5.05, 5.35, 5.2, 4.9, 4.5, 4.1]   # half width mesio-distal
kb = [4.3, 4.75, 5.45, 5.75, 5.6, 5.25, 4.8, 4.3]   # half width bucco-palatal
fa, fb = PchipInterpolator(ky, ka, extrapolate=True), PchipInterpolator(ky, kb, extrapolate=True)
yc = np.clip(Y, ky[0], ky[-1])
A, B = fa(yc).astype(np.float32), fb(yc).astype(np.float32)
Xs = X - 0.11 * Z + 0.05 * (Y - 2.0)   # slight rhomboid skew, mesial side leans
n = 2.55
sec = (np.abs(Xs / A) ** n + np.abs(Z / B) ** n) ** (1 / n) - 1
crown_side = sec * np.minimum(A, B) * 0.92          # ~mm distance inside/outside the wall

# ---- occlusal surface height field y_top(x, z): four cusps, rim ridges, fissures and pits
def gauss2(x, z, cx, cz, sx, sz):
    return np.exp(-(((x - cx) / sx) ** 2 + ((z - cz) / sz) ** 2))

x2, z2 = xs[:, None], zs[None, :]
top = 6.1 - 1.2 * gauss2(x2, z2, 0.0, 0.1, 2.9, 2.7)                 # shallow basin
cusps = [(-2.6, 2.7, 1.25, 2.0, 1.9), (2.7, 2.5, 1.05, 1.9, 1.8), (-2.5, -2.6, 1.45, 2.2, 2.1), (2.9, -2.3, 0.6, 1.6, 1.5)]
for cx, cz, amp, sx, sz in cusps:
    top = top + amp * gauss2(x2, z2, cx, cz, sx, sz)
top = top + 0.5 * gauss2(x2, z2, -4.4, 0.0, 0.9, 3.2) + 0.45 * gauss2(x2, z2, 4.3, 0.0, 0.9, 3.0)   # marginal ridges
top = top + 0.28 * gauss2(x2, z2, 0.0, 4.9, 3.2, 0.8) + 0.3 * gauss2(x2, z2, 0.0, -4.8, 3.0, 0.8)   # buccal/palatal rims


def groove(pts, depth, width):
    """smooth V-ish groove along a polyline in the x-z plane; returns the depth map"""
    pts = np.asarray(pts, np.float32)
    seg = np.concatenate([np.linspace(pts[i], pts[i + 1], 40, endpoint=False) for i in range(len(pts) - 1)] + [pts[-1:]])
    P = np.stack(np.meshgrid(xs, zs, indexing='ij'), -1).reshape(-1, 2)
    d = np.full(P.shape[0], 1e9, np.float32)
    for s in seg:
        d = np.minimum(d, (P[:, 0] - s[0]) ** 2 + (P[:, 1] - s[1]) ** 2)
    d = np.sqrt(d).reshape(len(xs), len(zs))
    return depth * np.exp(-(d / width) ** 2)


grooves = [
    ([(-4.1, 0.1), (-2.0, 0.0), (0.0, 0.05), (1.9, -0.15), (3.9, 0.1)], 2.0, 0.50),     # central
    ([(-0.1, 0.0), (-0.6, 2.0), (-0.35, 4.6)], 1.8, 0.46),                               # buccal
    ([(1.7, -0.1), (1.2, -1.7), (0.8, -3.1), (0.9, -4.5)], 1.7, 0.46),                   # distal oblique
    ([(-1.7, -0.1), (-1.3, -1.9), (-0.9, -4.2)], 1.5, 0.44),                             # palatal
    ([(-1.0, 0.1), (-2.6, 1.3), (-3.9, 2.0)], 1.0, 0.36),                                # mesial buccal branch
    ([(1.0, 0.0), (2.5, 1.2), (3.7, 1.8)], 0.9, 0.34),                                   # distal buccal branch
]
G = np.zeros_like(top)
for pts, dep, w in grooves:
    g = groove(pts, dep, w)
    top = top - g
    G = np.maximum(G, g / dep)
for cx, cz, dep, w in [(0.0, 0.1, 1.7, 0.95), (-3.1, 0.25, 1.4, 0.7), (2.9, 0.05, 1.2, 0.65), (-1.6, 2.6, 0.7, 0.45), (1.9, 2.4, 0.6, 0.42)]:
    g = dep * gauss2(x2, z2, cx, cz, w, w)
    top = top - g
    G = np.maximum(G, g / dep)
for _ in range(14):   # small supplementary fissures, so the surface does not look machined
    a0 = rng.uniform(0, 2 * np.pi); r0 = rng.uniform(0.7, 2.8)
    p0 = (r0 * np.cos(a0), r0 * np.sin(a0) * 0.9)
    p1 = (p0[0] + rng.uniform(-1.0, 1.0), p0[1] + rng.uniform(-1.0, 1.0))
    g = groove([p0, p1], rng.uniform(0.35, 0.7), rng.uniform(0.2, 0.3))
    top = top - g
    G = np.maximum(G, 0.6 * g / 0.7)
top = top.astype(np.float32)
crown_top = (Y - top[:, None, :])                       # <0 below the surface
crown_bottom = -0.6 - Y
crown = smax(smax(crown_side, crown_top * 0.85, 1.25), crown_bottom, 0.5)   # smooth intersections round the rim

# ---- root trunk (between the neck and the furcation)
tk_y = [-4.6, -3.0, -1.5, -0.4]
tka = [3.1, 3.5, 3.9, 4.0]
tkb = [3.5, 3.9, 4.3, 4.4]
fta, ftb = PchipInterpolator(tk_y, tka, extrapolate=True), PchipInterpolator(tk_y, tkb, extrapolate=True)
yt = np.clip(Y, tk_y[0], tk_y[-1])
At, Bt = fta(yt).astype(np.float32), ftb(yt).astype(np.float32)
Xt = X - 0.06 * Z
trunk = ((np.abs(Xt / At) ** 2.3 + np.abs(Z / Bt) ** 2.3) ** (1 / 2.3) - 1) * np.minimum(At, Bt) * 0.9
trunk = smax(trunk, np.maximum(-(Y + 4.8), (Y + 0.0)), 0.6)

# ---- roots: curved tapered tubes (centre line + radius)
roots = {
    'MB': dict(c=[(-2.3, -1.2, 2.2), (-2.9, -5.5, 3.1), (-3.5, -9.4, 3.6), (-3.9, -12.9, 3.7)], r=[1.95, 1.65, 1.0, 0.3]),
    'DB': dict(c=[(2.2, -1.2, 2.0), (2.7, -5.2, 2.8), (3.0, -9.0, 3.2), (3.2, -12.0, 3.3)], r=[1.65, 1.4, 0.9, 0.3]),
    'P':  dict(c=[(0.3, -1.4, -2.7), (0.5, -5.8, -3.7), (0.8, -10.2, -4.8), (1.0, -14.2, -5.3)], r=[2.3, 1.95, 1.15, 0.38]),
}


def tube_field(centre, radius, grid_pts, samples=90):
    c = np.asarray(centre, np.float32)
    t = np.linspace(0, 1, len(c))
    cs = CubicSpline(t, c, axis=0)
    rs = PchipInterpolator(t, radius)
    tt = np.linspace(0, 1, samples)
    C, R = cs(tt).astype(np.float32), rs(tt).astype(np.float32)
    P = grid_pts
    best = np.full(P.shape[0], 1e9, np.float32)
    for ci, ri in zip(C, R):
        d = np.sqrt((P[:, 0] - ci[0]) ** 2 + (P[:, 1] - ci[1]) ** 2 + (P[:, 2] - ci[2]) ** 2) - ri
        np.minimum(best, d, out=best)
    return best


# only evaluate the tubes where they can matter (below the neck), slab by slab, to keep memory low
ymask = ys < 1.5
Pall = np.stack([X[:, ymask, :].ravel(), Y[:, ymask, :].ravel(), Z[:, ymask, :].ravel()], 1)
root_f = {}
for k, v in roots.items():
    f = tube_field(v['c'], v['r'], Pall).reshape(len(xs), int(ymask.sum()), len(zs))
    full = np.full(X.shape, 9.0, np.float32)
    full[:, ymask, :] = f
    root_f[k] = full
    print('root', k, 'done')

phi = crown
phi = smin(phi, trunk, 1.1)
for k in root_f:
    phi = smin(phi, root_f[k], 0.9)
phi = gaussian_filter(phi, 0.9).astype(np.float32)     # remove voxel stair-stepping, keeps ~0.1 mm features
del crown, trunk, crown_side, crown_top


# ---- layers
cej = -0.15 + 0.5 * (np.abs(X) / 4.5) ** 2 - 0.25 * (np.abs(Z) / 5.0) ** 2
rel = Y - cej
t_enamel = (0.05 + 2.05 * smooth((rel + 0.1) / 2.6)) * (0.82 + 0.18 * np.clip(Y / 6.5, 0, 1.2))
t_enamel = np.where(rel < -0.25, 0.0, t_enamel).astype(np.float32)
enamel_f = np.maximum(phi, -(phi + t_enamel) - 1e-3)               # inside outer surface AND outside the dentin offset
dentin_inner = phi + t_enamel                                       # dentin = phi <= -t_enamel
chamber = smax(phi + 3.1 + 0.25 * np.clip(Y - 2.0, 0, None), -(Y + 1.6), 0.7)   # shrunken crown copy: horns under cusps
canal_f = None
for k, v in roots.items():
    c = np.asarray(v['c'], np.float32)
    c[0] = c[0] * 0.75 + np.array([0.0, 0.6, 0.0]) * 0.25
    cr = [0.55, 0.45, 0.3, 0.12]
    canal = tube_field(c, cr, Pall).reshape(len(xs), int(ymask.sum()), len(zs))
    full = np.full(X.shape, 9.0, np.float32)
    full[:, ymask, :] = canal
    canal_f = full if canal_f is None else np.minimum(canal_f, full)
pulp_f = smin(chamber, canal_f, 0.8)
pulp_f = np.maximum(pulp_f, phi + 0.35)                             # canals stop before the apex surface
pulp_f = gaussian_filter(pulp_f, 0.8).astype(np.float32)


def mc(field, level=0.0, tag=''):
    v, f, nrm, _ = marching_cubes(field, level=level, spacing=(SP, SP, SP), gradient_direction='ascent', allow_degenerate=False)
    v = v + np.array([X0, Y0, Z0], np.float32)
    print(tag, 'raw', len(f), 'tris')
    return v.astype(np.float32), f.astype(np.int32), nrm.astype(np.float32)


def decimate(v, f, target):
    if len(f) <= target:
        return v, f
    v2, f2 = fast_simplification.simplify(v.astype(np.float32), f.astype(np.int32), target_reduction=1 - target / len(f))
    return v2.astype(np.float32), f2.astype(np.int32)


def sample(vol, verts):
    idx = ((verts - np.array([X0, Y0, Z0], np.float32)) / SP).T
    return map_coordinates(vol, idx, order=1, mode='nearest')


def grad_normals(vol, verts, eps=1.4):
    out = np.zeros_like(verts)
    for a in range(3):
        d = np.zeros(3, np.float32); d[a] = eps * SP
        out[:, a] = sample(vol, verts + d) - sample(vol, verts - d)
    ln = np.linalg.norm(out, axis=1, keepdims=True) + 1e-9
    return out / ln


def solid(field_inside, name, outer_phi=None):
    """closed mesh of {field_inside <= 0}, normals from the field gradient"""
    v, f, _ = mc(field_inside, 0.0, name)
    v, f = decimate(v, f, 70000)
    n = grad_normals(field_inside, v)       # points toward increasing field, i.e. out of the solid
    return v, f, n


# colours (linear-ish sRGB 0..1)
IVORY = np.array([0.965, 0.945, 0.905]); IVORY_Y = np.array([0.93, 0.89, 0.80])
CEMENT = np.array([0.86, 0.76, 0.52]); DENTIN = np.array([0.92, 0.80, 0.55]); PULP = np.array([0.80, 0.18, 0.18])
STAIN = np.array([0.80, 0.66, 0.42])
groove_vol = None   # per-vertex fissure staining comes from the height-field map G


def groove_at(verts):
    gx = (verts[:, 0] - xs[0]) / SP; gz = (verts[:, 2] - zs[0]) / SP
    return map_coordinates(G.astype(np.float32), np.stack([gx, gz]), order=1, mode='nearest')


def enamel_colors(v):
    g = groove_at(v) * (v[:, 1] > 3.0)
    base = IVORY * (1 - 0.25 * smooth((4.2 - v[:, 1]) / 3.0))[:, None] + IVORY_Y * (0.25 * smooth((4.2 - v[:, 1]) / 3.0))[:, None]
    base = base + 0.012 * rng.standard_normal(v.shape[0])[:, None]
    return np.clip(base * (1 - 0.55 * g)[:, None] + STAIN * (0.55 * g)[:, None], 0, 1)


def to_mesh(v, f, n, colors, name):
    m = trimesh.Trimesh(vertices=v, faces=f, vertex_normals=n, process=False)
    rgba = np.concatenate([(colors * 255).astype(np.uint8), np.full((len(v), 1), 255, np.uint8)], 1)
    m.visual = trimesh.visual.ColorVisuals(m, vertex_colors=rgba)
    m.metadata['name'] = name
    return m


OUT.mkdir(parents=True, exist_ok=True)
stats = {}

# enamel
ve, fe, ne = solid(enamel_f, 'enamel')
col_e = enamel_colors(ve)
# dentin (with pulp cavity): region phi <= -t_enamel AND outside pulp
dentin_f = np.maximum(dentin_inner, -pulp_f)
vd, fd, nd = solid(dentin_f, 'dentin')
ph = sample(phi, vd); pu = sample(pulp_f, vd)
outer = ph > -0.12                                    # exposed root surface => cementum
col_d = np.where(outer[:, None], CEMENT[None, :], DENTIN[None, :]) + 0.01 * rng.standard_normal(len(vd))[:, None]
col_d = np.clip(col_d, 0, 1)
cavity = pu < 0.12                                    # wall of the pulp cavity
col_d[cavity & ~outer] = DENTIN * 0.96
# pulp
vp, fp, npl = solid(pulp_f, 'pulp')
col_p = np.clip(np.tile(PULP, (len(vp), 1)) + 0.05 * rng.standard_normal((len(vp), 1)) + 0.06 * (vp[:, 1:2] > 0), 0, 1)

for name, (v, f, n, c) in {'enamel': (ve, fe, ne, col_e), 'dentin': (vd, fd, nd, col_d), 'pulp': (vp, fp, npl, col_p)}.items():
    m = to_mesh(v, f, n, c, name)
    m.export(OUT / f'{name}.glb')
    sz = (OUT / f'{name}.glb').stat().st_size
    stats[name] = dict(vertices=int(len(v)), triangles=int(len(f)), bytes=int(sz), bbox=[list(map(float, m.bounds[0])), list(map(float, m.bounds[1]))])
    print(name, len(f), 'tris', f'{sz/1e6:.2f} MB')

(OUT / 'model.json').write_text(json.dumps(dict(units='mm', axes='x mesio-distal, y occlusal-up, z buccal-forward', spacing=SP, layers=stats, roots=list(roots)), indent=1))
print('done')
