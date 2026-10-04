import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../street')))
from build_batch_4 import build_harbour_crane

if __name__ == '__main__':
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../public/models/architecture'))
    build_harbour_crane(out_dir)
