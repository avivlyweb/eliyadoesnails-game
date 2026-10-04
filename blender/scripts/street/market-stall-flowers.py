import sys, os
sys.path.append(os.path.dirname(__file__))
from build_batch_3 import build_market_stall_flowers

if __name__ == '__main__':
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../public/models/street'))
    build_market_stall_flowers(out_dir)
