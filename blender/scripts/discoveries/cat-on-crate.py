import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../street')))
from build_batch_5 import build_cat_on_crate

if __name__ == '__main__':
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../public/models/discoveries'))
    build_cat_on_crate(out_dir)
