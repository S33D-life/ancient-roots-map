import {renderCanopy,showCanopyError} from './guided-gallery.js';
renderCanopy(Number(new URLSearchParams(location.search).get('circle'))).catch(showCanopyError);
