import sys, os
sys.path.append(os.path.dirname(__file__))
from build_batch_3 import build_crate_stack

if __name__ == '__main__':
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../public/models/street'))
    build_crate_stack(out_dir)
