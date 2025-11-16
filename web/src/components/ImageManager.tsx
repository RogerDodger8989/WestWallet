import React, { useEffect, useState, useRef } from 'react';
import { getImages, uploadImage, deleteImage } from '../api/imageApi';

interface ImageManagerProps {
  postId: string;
  category?: string;
}

const ImageManager: React.FC<ImageManagerProps> = ({ postId, category }) => {
  const [imageList, setImageList] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [overlayImage, setOverlayImage] = useState<string|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    setImageLoading(true);
    try {
      const imgs = await getImages(postId, category);
      setImageList(imgs);
      setImageError('');
    } catch {
      setImageError('Kunde inte hämta bilder');
    }
    setImageLoading(false);
  };

  useEffect(() => {
    fetchImages();
    // eslint-disable-next-line
  }, [postId, category]);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded shadow w-[500px] max-h-[80vh] overflow-y-auto relative">
      <h3 className="font-semibold mb-2">Bilder för post: {postId}</h3>
      {imageError && <div className="text-red-600 mb-2">{imageError}</div>}
      <div
        className="border-2 border-dashed rounded p-4 mb-4 text-center cursor-pointer bg-gray-50"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={async e => {
          e.preventDefault();
          e.stopPropagation();
          const files = Array.from(e.dataTransfer.files);
          setImageLoading(true);
          try {
            await uploadImage(postId, files as File[], category);
            await fetchImages();
            setImageError('');
          } catch {
            setImageError('Kunde inte ladda upp bilder');
          }
          setImageLoading(false);
        }}
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={async e => {
            if (!e.target.files) return;
            setImageLoading(true);
            try {
              await uploadImage(postId, Array.from(e.target.files), category);
              await fetchImages();
              setImageError('');
            } catch {
              setImageError('Kunde inte ladda upp bilder');
            }
            setImageLoading(false);
          }}
        />
        <span className="text-gray-600">Dra in bilder här eller klicka för att välja filer</span>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        {imageLoading ? <span>Laddar bilder...</span> : null}
        {imageList.length === 0 && !imageLoading ? <span className="text-gray-400">Inga bilder uppladdade.</span> : null}
        {imageList.map(img => (
          <div key={img} className="relative group">
            <img
              src={img}
              alt="thumbnail"
              className="w-20 h-20 object-cover rounded shadow cursor-pointer border border-gray-300"
              onClick={() => setOverlayImage(img)}
            />
            <button
              className="absolute top-1 right-1 bg-red-600 text-white rounded px-2 py-1 text-xs opacity-80 group-hover:opacity-100"
              title="Ta bort bild"
              onClick={async e => {
                e.stopPropagation();
                setImageLoading(true);
                try {
                  const filename = img.split('/').pop() || img;
                  await deleteImage(postId, filename, category);
                  await fetchImages();
                  setImageError('');
                } catch {
                  setImageError('Kunde inte ta bort bild');
                }
                setImageLoading(false);
              }}
            >🗑️</button>
          </div>
        ))}
      </div>
      {overlayImage && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={() => setOverlayImage(null)}>
          <img src={overlayImage} alt="overlay" className="max-w-2xl max-h-[80vh] rounded shadow-lg" />
        </div>
      )}
    </div>
  );
};

export default ImageManager;
