"""Flag-off build: no paywall or Premium text (wrapper so ci_local_server.sh, which passes no arguments, can run mode off)."""
import sys,runpy,os
sys.argv=[sys.argv[0],"off"]
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)),"premium_e2e.py"),run_name="__main__")
