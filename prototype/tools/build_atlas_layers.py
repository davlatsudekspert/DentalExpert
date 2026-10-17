"""Split the photographic cutaway into registered layer plates for the 3D atlas.
Plates partition the photo's pixels (pulp, dentin, enamel, exterior), so stacked at z=0 they reproduce the photo exactly;
separated along z they float apart. A vessel plate is extracted from the photo's own red/blue vessel lines.
Output: public/atlas3d/*.webp + meta.json."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.morphology import disk, binary_closing, binary_dilation, binary_opening, remove_small_objects, remove_small_holes

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets/tooth3d/premium-reference-cutaway-ivory.webp'
OUT = ROOT / 'public/atlas3d'; OUT.mkdir(parents=True, exist_ok=True)

im = Image.open(SRC).convert('RGBA'); A = np.array(im).astype(np.float32) / 255
H, W = A.shape[:2]
rgb, al = A[..., :3], A[..., 3]
mx, mn = rgb.max(-1), rgb.min(-1); d = mx - mn + 1e-6
s, v = d / (mx + 1e-6), mx
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
body = al > 0.5

pulp = ((h < 22) | (h > 335)) & (s > 0.40) & (v > 0.45) & body
pulp = remove_small_objects(pulp, 400); pulp = binary_closing(pulp, disk(5)); pulp = remove_small_holes(pulp, 3000)
beige = (h > 30) & (h < 58) & (s > 0.18) & (v > 0.78) & body
beige = remove_small_objects(beige, 200)
core = beige | pulp
core = binary_closing(core, disk(9)); core = remove_small_holes(core, 6000)
core = remove_small_objects(core, 5000)
# enamel cut face: traced outline (photo coordinates) of the translucent cap that wraps the dentin on the cut plane
from PIL import ImageDraw
poly = [(628, 252), (700, 226), (740, 208), (790, 172), (840, 148), (900, 120), (945, 118), (985, 152), (1012, 215),
        (1022, 300), (1020, 390), (1002, 470), (988, 540), (968, 590), (958, 650), (628, 650)]
pm_ = Image.new('L', (W, H), 0); ImageDraw.Draw(pm_).polygon(poly, fill=255)
poly_mask = np.array(pm_) > 0
# clean the dentin core: smooth ragged edges, keep the largest piece, keep it right of the cut edge
core = binary_opening(core, disk(7)); lab, n_ = ndi.label(core)
if n_ > 1:
    sizes = ndi.sum(core, lab, range(1, n_ + 1)); core = lab == (1 + int(np.argmax(sizes)))
core &= (np.arange(W)[None, :] >= 628)
core = binary_closing(core, disk(6))
cut = (core | pulp) & body
enamel = poly_mask & body & ~core & ~pulp
enamel = binary_closing(enamel, disk(3)); enamel &= body
# partition
P = pulp & cut
D = cut & ~P & ~enamel
E = enamel & ~P & ~D
X = body & ~(P | D | E)
print('areas px  pulp', P.sum(), 'dentin', D.sum(), 'enamel', E.sum(), 'exterior', X.sum(), 'body', body.sum())


def plate(mask, bleed=0, feather=1.2):
    m = binary_dilation(mask, disk(bleed)) if bleed else mask
    m = ndi.gaussian_filter(m.astype(np.float32), feather) if feather else m.astype(np.float32)
    m = np.clip(m * 1.0, 0, 1)
    out = np.zeros((H, W, 4), np.float32)
    out[..., :3] = rgb
    out[..., 3] = m * al
    return out


TEX = 1024

def save(arr, name, q=90):
    img = Image.fromarray((np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA')
    if img.size != (TEX, TEX): img = img.resize((TEX, TEX), Image.LANCZOS)
    img.save(OUT / f'{name}.webp', 'WEBP', quality=q, method=6)


# interior fill for the holes the plates leave in the plate behind them (a darker, warm "solid" interior)
def interior_fill(region, base_rgb, strength=0.62):
    dist = ndi.distance_transform_edt(region)
    k = np.clip(dist / 60, 0, 1)[..., None]
    shade = np.array(base_rgb, np.float32)[None, None, :]
    col = shade * (1 - 0.35 * k) * strength + 0.18 * (1 - strength)
    return col

cut_hole = binary_dilation(cut, disk(2))
fill = interior_fill(cut_hole, (0.86, 0.74, 0.50))
ext = plate(X, bleed=2, feather=1.0)                       # exterior shell (crown + roots surface), 2 px bleed under the cut
fill_alpha = ndi.gaussian_filter((cut_hole & body).astype(np.float32), 1.2)
back = np.zeros((H, W, 4), np.float32); back[..., :3] = fill; back[..., 3] = fill_alpha * al      # solid interior, sits behind everything
save(ext, 'exterior'); save(back, 'interior')
save(plate(E, bleed=1), 'enamel'); save(plate(D, bleed=1), 'dentin'); save(plate(P, bleed=1), 'pulp')

# vessels: thin dark-red / blue lines inside the pulp, taken from the photo and re-coloured for emphasis
L = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
local = ndi.gaussian_filter(L, 5) - L
from skimage.morphology import binary_erosion as _er
pm = _er(P, disk(10))                                   # keep clear of the pulp rim, which is shading, not a vessel
lines = (local > 0.075) & pm
lines = remove_small_objects(lines, 70)
bluish = (b > r * 0.78) & lines
red = lines & ~bluish
V = np.zeros((H, W, 4), np.float32)
V[red] = [1.0, 0.20, 0.16, 1.0]
V[bluish] = [0.20, 0.45, 1.0, 1.0]
V[..., 3] = np.clip(ndi.gaussian_filter(V[..., 3], 0.8) * 1.4, 0, 1)
V[..., :3] = np.where(V[..., 3:4] > 0, V[..., :3], 0)
save(V, 'vessels', q=95)

# nerves: yellow lines along the medial axis of the pulp (chamber + both canals), drawn slightly inside the vessels
from skimage.morphology import skeletonize, binary_erosion
core_p = binary_erosion(P, disk(7))
sk = skeletonize(core_p)
sk = binary_dilation(sk, disk(2))
N = np.zeros((H, W, 4), np.float32)
N[sk] = [1.0, 0.82, 0.22, 1.0]
N[..., 3] = np.clip(ndi.gaussian_filter(N[..., 3], 1.0) * 1.5, 0, 1)
N[..., :3] = np.where(N[..., 3:4] > 0, N[..., :3], 0)
save(N, 'nerves', q=95)
# soft contact shadows (blurred silhouettes) used behind each floating plate
for n_, m_ in {'exterior': X, 'dentin': D, 'enamel': E, 'pulp': P}.items():
    sh = np.zeros((H, W, 4), np.float32); sh[..., 3] = np.clip(ndi.gaussian_filter(m_.astype(np.float32), 14) * 0.9, 0, 1)
    save(sh, f'shadow_{n_}', q=70)

# a faint glow mask per layer for the selection highlight
for n, m in {'pulp': P, 'dentin': D, 'enamel': E}.items():
    g_ = ndi.gaussian_filter(binary_dilation(m, disk(2)).astype(np.float32), 9)
    arr = np.zeros((H, W, 4), np.float32); arr[..., :3] = 1; arr[..., 3] = np.clip(g_ * 1.2, 0, 1) * (1 - np.clip(ndi.gaussian_filter(m.astype(np.float32), 1.0), 0, 1)) * 0.0 + np.clip(g_, 0, 1)
    save(arr, f'glow_{n}', q=70)

# assembled check: composite back->front and compare to the photo
comp = np.zeros((H, W, 3), np.float32); ca = np.zeros((H, W), np.float32)
def over(layer):
    global comp, ca
    a_ = layer[..., 3]; comp = layer[..., :3] * a_[..., None] + comp * (1 - a_[..., None]); ca = a_ + ca * (1 - a_)
for lay in (back, ext, plate(D, 1), plate(E, 1), plate(P, 1)):
    over(lay)
bg = np.array([0.90, 0.94, 0.965], np.float32)
orig = rgb * al[..., None] + bg * (1 - al[..., None]); rec = comp + bg * (1 - ca[..., None])
err = np.abs(orig - rec)[body].mean()
print('mean abs error assembled vs photo', round(float(err), 4))
Image.fromarray((np.clip(rec, 0, 1) * 255).astype(np.uint8)).save('/tmp/sim/assembled.png')

def centroid(m):
    ys_, xs_ = np.nonzero(m); return [int(xs_.mean()), int(ys_.mean())]
k_ = TEX / W
sc_ = lambda pt: [round(pt[0] * k_), round(pt[1] * k_)]
meta = dict(size=[TEX, TEX], plates=['interior', 'exterior', 'dentin', 'enamel', 'pulp', 'vessels', 'nerves'],
            anchors=dict(pulp=sc_(centroid(P)), dentin=sc_(centroid(D)), enamel=sc_(centroid(E)), exterior=sc_([430, 900]), vessels=sc_([800, 520])),
            bbox=[round(float(v_) * k_) for v_ in (np.nonzero(body.any(0))[0].min(), np.nonzero(body.any(1))[0].min(), np.nonzero(body.any(0))[0].max(), np.nonzero(body.any(1))[0].max())])
(OUT / 'meta.json').write_text(json.dumps(meta, indent=1))
Image.fromarray((np.stack([P, D, E], -1) * 255).astype(np.uint8)).save('/tmp/sim/partition.png')
print(meta['anchors'], meta['bbox'])
