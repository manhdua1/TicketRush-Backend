import Link from "next/link";
import { Globe, Mail, MapPin, Phone, Share2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/35">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-24">
          <div className="space-y-8 lg:basis-90 lg:shrink-0">
            <div>
              <h3 className="text-sm font-bold text-foreground/90">Hotline</h3>
              <div className="mt-2 flex items-center gap-2">
                <Phone className="h-4 w-4 text-foreground/60" />
                <a
                  href="tel:XXXXXXXX"
                  className="text-2xl font-extrabold tracking-tight text-primary transition hover:text-primary/90"
                >
                  XXXX.XXXX
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground/90">Email</h3>
              <a
                href="mailto:support@ticketrush.vn"
                className="mt-3 inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
              >
                <Mail className="h-4 w-4 text-foreground/60" />
                support@ticketrush.vn
              </a>
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground/90">
                Văn phòng chính
              </h3>
              <div className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted">
                <MapPin className="mt-0.5 h-4 w-4 text-foreground/60" />
                <p>
                    Tầng X, Tòa nhà Y, Số ZZ Đường ABC, Phường DEF, Thành phố H
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 lg:basis-75 lg:shrink-0">
            <div>
              <h3 className="text-sm font-bold text-foreground/90">
                Ban tổ chức
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    href="#"
                    className="text-muted transition hover:text-foreground"
                  >
                    Đăng ký sự kiện
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted transition hover:text-foreground"
                  >
                    Bảng giá dịch vụ
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted transition hover:text-foreground"
                  >
                    Tư vấn
                  </Link>
                </li>
              </ul>
            </div>
        </div>


          <div className="min-w-0 lg:flex-1">
            <h3 className="text-sm font-bold text-foreground/90">
              Thông tin
            </h3>
            <ul className="mt-3 space-y-3 text-sm">
              <li>
                <Link
                  href="#"
                  className="text-muted transition hover:text-foreground"
                >
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted transition hover:text-foreground"
                >
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted transition hover:text-foreground"
                >
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted transition hover:text-foreground"
                >
                  Chính sách hoàn vé
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-sm text-muted sm:flex-row sm:items-center">
          <p>© 2026 TicketRush. Nền tảng quản lý và phân phối vé sự kiện hàng đầu Việt Nam.</p>
          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="Mạng xã hội"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/50 text-foreground/75 backdrop-blur-xl transition hover:bg-surface/70 hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
            </a>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/50 px-3 py-2 text-xs font-semibold text-foreground/80 backdrop-blur-xl transition hover:bg-surface/70 hover:text-foreground"
              aria-label="Ngôn ngữ"
            >
              <Globe className="h-4 w-4" />
              VI
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
