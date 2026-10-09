import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { buttonVariants } from "../components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Compass className="size-7" />
      </span>
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">404</p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">Không tìm thấy trang</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link to="/bookmarks" className={`${buttonVariants({ className: "mt-6" })}`}>
        Quay lại dấu trang
      </Link>
    </div>
  );
}
