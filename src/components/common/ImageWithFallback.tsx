import React from 'react'
import Image from 'next/image'

export const ImageWithFallback = ({src, alt, imageClassname}:{src:string; alt: string; imageClassname?: string}) => {
  return (
    <div className={`${src?'':"relative max-w-[12.375rem] min-h-[2.75rem] m-auto  object-contain"}`}>
      <Image src={src||'/fallback.png'} alt={alt||`world-youth-festival`} layout='fill' className={` ${imageClassname}`}></Image>
    </div>
  )
}

