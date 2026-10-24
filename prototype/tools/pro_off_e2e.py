"""Flag-off browser walk: see pro_e2e.py (mode off). Needs the normal build and a server without PRO_ENABLED."""
import runpy,sys
sys.argv=["pro_e2e.py","off"]
runpy.run_path("tools/pro_e2e.py",run_name="__main__")
