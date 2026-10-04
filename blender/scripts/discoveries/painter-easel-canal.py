import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../street')))
from build_batch_5 import build_painter_easel_canal

if __name__ == '__main__':
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../public/models/discoveries'))
    build_painter_easel_canal(out_dir)
