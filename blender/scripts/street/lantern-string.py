import sys, os
sys.path.append(os.path.dirname(__file__))
from build_batch_5 import build_lantern_string

if __name__ == '__main__':
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../public/models/street'))
    build_lantern_string(out_dir)
