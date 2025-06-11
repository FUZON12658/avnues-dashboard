'use client';
import { cn } from '@/lib/utils';
import axios from 'axios';
import JoditEditor from 'jodit-react';
import React, { useMemo, useState } from 'react';

interface EditorProps {
  className?: string;
  variable?: string;
  onChange?: (value: any) => void;
  value?: any;
  editorStyles?: string;
  width?: string | number;
}
const CustomJodit = React.forwardRef<any, EditorProps>((props, ref) => {
  const {
    className,
    variable,
    onChange,
    value,
    editorStyles = '',
    width,
  } = props;

  const [preview, setPreview] = useState(false);

  const config = useMemo(
    () => ({
      disablePlugins: 'add-new-line',
      readonly: false,
      zIndex: 9999,
      uploader: {
        insertImageAsBase64URI: false,
        imagesExtensions: ['jpg', 'png', 'jpeg', 'gif', 'svg', 'webp'],
        url: `${process.env.NEXT_PUBLIC_API_HOST}/api/v1/upload-image-profile`,
        format: 'json',
        prepareData: (data: any) => {
          const file = data.get('files[0]');
          if (file) {
            data.delete('files[0]');
            data.append('images', file);
          }
          for (let pair of data.entries()) {
            console.log(`FormData: ${pair[0]}: ${pair[1]}`);
          }
          data.append('id', 24); // Example of appending additional data
          return data;
        },
        isSuccess: (resp: any) => !resp.error,
        getMessage: (resp: any) => resp.msg,
        process: (resp: any) => {
          console.log('Entering process function with response:', resp);
               console.log('Entering process function with response:', resp[0].url);
          return {
            files: resp[0].files || [`${process.env.NEXT_PUBLIC_API_HOST}${[resp[0].url]}`],
            path: resp.path,
            baseurl: resp.baseurl,
            error: resp.error,
            msg: resp.msg,
          };
        },
        defaultHandlerSuccess: function (data: any) {
          console.log('defaultHandlerSuccess:', data);
          if (data.files && data.files.length) {
            data.files.forEach((file: any) => {
              //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
              this.s.insertImage(file); // Directly insert the image link
            });
          }
        },
        error: function (e: any) {
          console.error('Upload error:', e);
          //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
          this.message.message(e.getMessage(), 'error', 4000);
        },
      },
      events: {
        afterRemoveNode: (node: any) => {
          if (node.tagName === 'IMG') {
            const imageUrl = node.getAttribute('src');
            console.log('Image URL to delete:', imageUrl);
            axios
              .post(
                `${process.env.NEXT_PUBLIC_BLOG_HOST}/blogAdminApi/delete-images`,
                { imageLinks: [imageUrl] }
              )
              .then((response) => {
                console.log('Image deleted successfully:', response.data);
              })
              .catch((error) => {
                console.error('Error deleting image:', error);
              });
          }
        },
      },
    }),
    []
  );

  const handleBlur = (value: string | number | null) => {
    if (value === undefined || value === null) return;
    //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
    onChange(value);
    //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
    localStorage.setItem(variable, String(value)); // ensure value is stringified
  };
  return (
    <>
      <div
        className={cn(
          'flex items-center flex-col',
          `w-[${width}px] z-40 `,
          className
        )}
      >
        <div className={`w-[${width}px]`}>
          <JoditEditor
            ref={ref}
            value={value}
            config={config}
            onBlur={handleBlur}
            className={`w-[${width}px] default-styles`}
          />
          <style>{`.jodit-container:not(.jodit_inline) .jodit-wysiwyg {
    margin: 0;
    outline: 0;
    margin-left:auto;
    margin-right:auto;
    overflow-x: auto;
    padding: 8px;
    position: relative;
}
    .jodit-container:not(.jodit_inline) .jodit-wysiwyg::-webkit-scrollbar {
            width: 2px; /* Adjust width for vertical scrollbar */
            border-radius: 100px;
          }

    .jodit-container:not(.jodit_inline) .jodit-wysiwyg::-webkit-scrollbar-track {
            background: #f0f0f0; /* Track color */
          }

          .jodit-container:not(.jodit_inline) .jodit-wysiwyg::-webkit-scrollbar-thumb {
            background-color: #888; /* Scrollbar thumb color */
            border-radius: 20px; /* Rounded corners */
          }

          .jodit-container:not(.jodit_inline) .jodit-wysiwyg::-webkit-scrollbar-thumb:hover {
            background-color: #555; /* Thumb color on hover */
          }
    .jodit-wysiwyg{ max-width: calc(100%-8px); overflow: scroll; word-wrap: break-word; overflow-wrap: break-word; scrollbar-width: thin;
            scrollbar-color: #888 transparent; ${editorStyles} }
          .zodit-editor-container {
  width: 100%;
  max-width: 100%; /* Set max-width so content doesn't overflow */
}

.zodit-editor-container img {
  max-width: 100%; /* Make images responsive */
  height: auto;
}

.default-styles img {
    margin: 1rem;
}



.zodit-editor-container iframe {
  width: 100%; /* Make embedded iframes responsive */
  height: auto;
}

/* Handle tables */
.zodit-editor-container table {
  width: 100%;
  overflow-x: auto;
  display: block;
}

/* Handle blockquotes, code blocks, etc. */
.zodit-editor-container blockquote,
.zodit-editor-container pre {
  width: 100%;
  overflow-x: auto;
}`}</style>
        </div>
      </div>
    </>
  );
});
CustomJodit.displayName = 'CustomJodit'; // ✅ Add this line
export default CustomJodit;
