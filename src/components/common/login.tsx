
import { AuthClientComponent } from "@/components/common/Auth-Client-Component";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { GalleryVerticalEnd } from "lucide-react"
import { Toaster } from "sonner";

export default function AuthComponent() {
  return (
    <div>
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md  border-wyfPrimary border text-primary-foreground">
              <div className="w-5 h-5 flex items-center justify-center relative">
              <ImageWithFallback src="/emblem.png" alt="wyf" imageClassname="object-contain rounded-sm" />
              </div>
            </div>
            Club Management Software
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <AuthClientComponent isAdmin={true} isClient={false} />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-transparent lg:block">
        <img
          src="/clubmgmt.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
    <Toaster/>
    </div>
  )
}
