import sys, os
sys.path.append(os.path.dirname(__file__))
from build_batch_5 import build_ice_cream_cart

if __name__ == '__main__':
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../public/models/street'))
    build_ice_cream_cart(out_dir)
