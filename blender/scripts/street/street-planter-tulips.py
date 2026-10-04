import sys, os
sys.path.append(os.path.dirname(__file__))
from build_batch_1 import build_street_planter_tulips

if __name__ == '__main__':
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../public/models/street'))
    build_street_planter_tulips(out_dir)
