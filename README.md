# Bookmark Manager

Quản lý dấu trang full-stack: lưu, gắn thẻ, tìm kiếm và xem lại các liên kết yêu thích. Client xây bằng React + TypeScript + Vite + Tailwind CSS, server xây bằng Express + TypeScript + Prisma + PostgreSQL.

## Tính năng

- **Xác thực** — đăng ký / đăng nhập bằng JWT (băm mật khẩu bằng scrypt), bảo vệ route cả ở API lẫn giao diện.
- **Dấu trang** — tạo, đọc, sửa, xóa, phát hiện URL trùng (409), ghim / bỏ ghim, lưu trữ / khôi phục, đếm lượt truy cập (`viewCount`, `lastVisitedAt`).
- **Thẻ** — quan hệ nhiều-nhiều có màu sắc, tạo/đổi tên/đổi màu/xóa, lọc dấu trang theo thẻ với chế độ **ANY / ALL**.
- **Tìm kiếm & sắp xếp** — tìm kiếm debounce (300 ms) theo tiêu đề, URL và mô tả; sắp xếp: mới nhất, cũ nhất, truy cập gần đây, xem nhiều nhất, tiêu đề A→Z / Z→A; dấu trang được ghim nổi lên đầu; phân trang.
- **Lấy metadata** — server tự lấy tiêu đề / mô tả / favicon của trang, có chống SSRF (chặn IP riêng & hostname nội bộ, giới hạn redirect, timeout, giới hạn dung lượng).
- **Nhập / xuất** — nhập hàng loạt dấu trang (bỏ qua URL đã có) và xuất toàn bộ thư viện ra JSON.
- **Thống kê** — đếm dấu trang tất cả / đã ghim / đã lưu trữ (hiện ở thanh bên).
- **Giao diện** — giao diện sáng & tối (ghi nhớ, không chớp khi tải), bố cục responsive với sidebar trên mobile, chế độ lưới/danh sách, các trạng thái rỗng/tải/lỗi, toast, hộp thoại & menu dễ tiếp cận.
- **Sẵn sàng production** — Express serve luôn client đã build (fallback SPA), Helmet CSP, CORS, giới hạn tần suất (auth / API / metadata), định dạng lỗi có cấu trúc.

## Công nghệ

| Tầng | Stack |
|------|-------|
| Client | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, lucide-react |
| Server | Express 5, TypeScript, Zod, Helmet, express-rate-limit, jsonwebtoken |
| Database | PostgreSQL (Neon hoặc local), Prisma 7 (generator `prisma-client`) |
| Công cụ | npm workspaces, tsx, esbuild, Vitest, ESLint (flat config), concurrently |

## Yêu cầu

- Node.js 20+ (đã kiểm thử trên Node 22)
- npm 10+
- Một database PostgreSQL — [Neon](https://neon.tech) (có gói miễn phí) hoặc PostgreSQL chạy local

## Bắt đầu nhanh

```bash
# 1. Cài dependency (tự sinh Prisma client qua postinstall)
npm install

# 2. Cấu hình môi trường
cp server/.env.example server/.env
#    rồi sửa server/.env:
#    - DATABASE_URL  -> chuỗi kết nối Neon / PostgreSQL local
#    - JWT_SECRET    -> chuỗi ngẫu nhiên dài

# 3. Tạo schema và seed dữ liệu demo
npm run db:migrate
npm run db:seed

# 4. Chạy ứng dụng (API :4000, Vite dev :5173)
npm run dev
```

Mở **http://localhost:5173** và đăng nhập bằng tài khoản demo:

```
email:    demo@example.com
password: password123
```

Seed tạo 15 dấu trang (2 đã lưu trữ) và 6 thẻ để mọi chế độ xem đều có dữ liệu.

## Build production

```bash
npm run build   # build server (esbuild bundle) + client (Vite)
npm start       # serve API và client đã build tại http://localhost:4000
```

Đảm bảo đã set `NODE_ENV=production` và `JWT_SECRET` mạnh trong `server/.env`.

## Deploy lên Vercel + Neon

Repo đã cấu hình sẵn cho Vercel (`vercel.json` + `api/[...path].ts`): một project vừa serve client tĩnh (`client/dist`, SPA rewrite) **vừa** serve API Express dưới dạng serverless function tại `/api/*`.

1. **Đẩy repo lên GitHub.**
2. **Tạo project Neon** và copy chuỗi kết nối **Pooled** (`...?sslmode=require`).
3. **Vercel → Add New Project → Import repo.** Root = thư mục gốc repo; `vercel.json` đã set:
   - `installCommand`: `npm install` (postinstall sinh Prisma client)
   - `buildCommand`: `npm run db:deploy && npm run build` (chạy migration rồi build)
   - `outputDirectory`: `client/dist`
   - SPA rewrite cho mọi path không phải `/api`
4. **Environment variables** (cả Production *và* Preview):

   | Biến | Giá trị |
   |------|---------|
   | `DATABASE_URL` | chuỗi kết nối Neon pooled |
   | `JWT_SECRET` | chuỗi ngẫu nhiên dài (≥ 16 ký tự) |
   | `CLIENT_ORIGIN` | `https://<ten-app>.vercel.app` |
   | `NODE_ENV` | `production` (Vercel tự đặt sẵn) |
   | `VITE_API_URL` | *tuỳ chọn* — chỉ cần khi API host ở origin khác |

5. **Deploy.** Migration chạy ở mỗi lần build; entry function là `api/[...path].ts`
   (`createApp()` từ server, không cần `listen`).
6. *Tuỳ chọn:* nạp data demo 1 lần cho production: `DATABASE_URL=... npm run db:seed`.

**Tách API sau này:** deploy API sang project Vercel thứ hai (cùng entry `api/`), rồi set
`VITE_API_URL=https://<api-app>.vercel.app` ở project client (lúc build) và set `CLIENT_ORIGIN`
trên API là URL client. Để `VITE_API_URL` trống thì client gọi `/api/*` tương đối (cùng domain —
cũng là cách Vite proxy dùng ở môi trường dev).

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy API (`tsx watch`) và Vite song song |
| `npm run build` | Build bundle server + client |
| `npm start` | Chạy server đã build (`server/dist/index.js`) |
| `npm run typecheck` | `tsc --noEmit` cho cả server và client |
| `npm run lint` | ESLint toàn workspace |
| `npm run test` | Unit test Vitest (chuẩn hoá URL, phân tích metadata) |
| `npm run db:migrate` | Tạo/áp dụng migration Prisma (dev) |
| `npm run db:seed` | Seed user demo, dấu trang và thẻ |
| `npm run db:generate` | Sinh lại Prisma client (cũng chạy khi `npm install`) |
| `npm run db:studio` | Mở Prisma Studio |
| `npm run db:deploy` / `npm run db:push` | Áp dụng migration production / đẩy schema |

## Biến môi trường (`server/.env`)

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `DATABASE_URL` | — | Chuỗi kết nối PostgreSQL (`?schema=public`, thêm `?sslmode=require` cho Neon) |
| `PORT` | `4000` | Cổng API |
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Origin(s) cho CORS, cách nhau bằng dấu phẩy |
| `JWT_SECRET` | secret mặc định cho dev | Secret ký token (tối thiểu 16 ký tự) |
| `JWT_EXPIRES_IN` | `7d` | Thời hạn access token |

## Tổng quan API

Mọi phản hồi dùng envelope `{ "success": true, "data": ... }` hoặc
`{ "success": false, "error": { "code", "message", "details?" } }`.
Các endpoint cần đăng nhập gửi header `Authorization: Bearer <token>`.

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Tạo tài khoản, trả về token |
| POST | `/api/auth/login` | Đăng nhập, trả về token |
| GET | `/api/auth/me` | Thông tin người dùng hiện tại |
| GET | `/api/bookmarks` | Danh sách — `search`, `tags`, `tagMode=any\|all`, `sortBy`, `archived`, `pinned`, `pinFirst`, `page`, `limit` |
| POST | `/api/bookmarks` | Tạo mới (409 nếu URL trùng) |
| GET/PATCH/DELETE | `/api/bookmarks/:id` | Đọc / sửa / xóa |
| POST | `/api/bookmarks/:id/{pin,unpin,archive,restore,visit}` | Hành động cờ & đếm lượt truy cập |
| GET | `/api/bookmarks/stats` | `{ all, pinned, archived }` |
| GET | `/api/bookmarks/export` | Xuất toàn bộ thư viện ra JSON |
| POST | `/api/bookmarks/import` | Nhập hàng loạt, trả về `{ imported, skipped, total }` |
| POST | `/api/bookmarks/metadata` | Lấy metadata trang (chống SSRF, có rate limit) |
| GET/POST | `/api/tags` | Liệt kê / tạo thẻ |
| PATCH/DELETE | `/api/tags/:id` | Đổi tên/đổi màu / xóa |
| GET | `/api/health` | Kiểm tra sức khoẻ |

## Cấu trúc dự án

```
├── client/                 # React app
│   ├── public/             # theme-init.js (giao diện không chớp), favicon
│   └── src/
│       ├── components/     # ui primitives, bookmarks, layout
│       ├── context/        # Auth, Theme, Toast providers
│       ├── hooks/          # useBookmarks, useTags, useDebounce, ...
│       ├── pages/          # Bookmarks, Tags, Settings, Login, Register
│       └── services/       # các API call có kiểu
└── server/                 # Express API
    ├── prisma/             # schema, migrations, seed.ts
    └── src/
        ├── config/         # validate env (Zod)
        ├── controllers/    # request handlers
        ├── lib/            # prisma, jwt, password, url + guard SSRF
        ├── middleware/     # auth, validation, rate limits, errors
        ├── routes/         # auth, bookmarks, tags
        ├── services/       # nghiệp vụ (bookmarks, tags, auth, import, metadata)
        └── validators/     # Zod schemas dùng chung cho routes
```

## Kiểm thử & chất lượng

```bash
npm run lint        # ESLint (flat config, react-hooks + typescript-eslint)
npm run typecheck   # TypeScript strict cho cả hai workspace
npm run test        # Vitest: chuẩn hoá URL/guard SSRF, phân tích metadata (23 test)
```

Toàn bộ bề mặt API (auth, CRUD, tìm kiếm/sắp xếp/lọc, phân trang, ghim/lưu trữ/truy cập, nhập/xuất, vòng đời thẻ, validation và các nhánh lỗi SSRF) đã được kiểm chứng end-to-end trên PostgreSQL thật.

## Ghi chú bảo mật

- Mật khẩu băm bằng `scrypt` của Node (salt riêng từng user).
- Token JWT bearer có hạn cấu hình; phản hồi 401 xoá phiên phía client.
- Lấy metadata chặn địa chỉ private/loopback/link-local, hostname nội bộ, scheme không phải HTTP(S), theo tối đa 3 redirect với timeout 5 s và giới hạn body 512 KB.
- Giới hạn tần suất: 30 lần đăng nhập / 15 phút, 600 yêu cầu API / 15 phút, 20 lần lấy metadata / phút mỗi IP.
- Helmet CSP, CORS origin chặt, giới hạn body JSON 1 MB.
