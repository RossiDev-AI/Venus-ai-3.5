
import React, { useEffect, useState } from 'react';
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import ImageEditor from '@uppy/image-editor';
import Compressor from '@uppy/compressor';

// Import styles via index.html to avoid bundler issues in this environment

interface UppyUploaderProps {
  onUploadComplete: (fileUrl: string, fileData: Blob) => void;
  maxFileSize?: number; // bytes
  allowedFileTypes?: string[];
  height?: number;
}

const UppyUploader: React.FC<UppyUploaderProps> = ({ 
  onUploadComplete, 
  maxFileSize = 10 * 1024 * 1024, 
  allowedFileTypes = ['image/*'],
  height = 350
}) => {
  const [uppy] = useState(() => {
    const u = new Uppy({
      restrictions: {
        maxFileSize: maxFileSize,
        maxNumberOfFiles: 1,
        minNumberOfFiles: 1,
        allowedFileTypes: allowedFileTypes,
      },
      autoProceed: false,
    });

    u.use(ImageEditor, {
      quality: 0.8,
    });

    u.use(Compressor, {
      quality: 0.8,
      limit: 1,
    });

    return u;
  });

  useEffect(() => {
    uppy.on('complete', (result) => {
      if (result.successful.length > 0) {
        const file = result.successful[0];
        const blob = file.data;
        // Create an Object URL for immediate preview
        const url = URL.createObjectURL(blob);
        onUploadComplete(url, blob);
      }
    });

    return () => {
      uppy.close();
    };
  }, [uppy, onUploadComplete]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/5 bg-[#0e0e11]">
      <Dashboard
        uppy={uppy}
        plugins={['ImageEditor']}
        width="100%"
        height={height}
        theme="dark"
        showProgressDetails={true}
        hideUploadButton={true} // Auto-upload logic handled by parent usually, but here we process locally
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
};

export default UppyUploader;
