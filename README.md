# BBITSENA

SevenKnights: Rebirth strategy community site for posts, notices, guild-war sheets, PVE/PVP guides, notifications, and coupon tools.

## Main Features

- Community board with categories, search, recommendations, comments, replies, media uploads, YouTube embeds, drafts, and post edit/delete.
- Notice board for operator notices with a dedicated notice list, notice detail view, and notice upload page.
- Highlighted popular-post tab that collects posts with recommendations.
- Admin quick post menu from the main list for moving posts, hiding/deleting posts, opening edit view, and pinning posts to the top.
- Guild-war sheet writer and public viewer for attack/defense sheets, formations, heroes, pets, gear, rings, skill order, and memo tips.
- PVE/PVP guide input forms with hero, pet, formation, ring, stat, and memo data.
- Login and account system with local login plus Kakao/Google flow, profile page, role icons, and nickname editing.
- Role and permission system for superadmin, admin, elite, user, and blocked users.
- Realtime-style notifications for comments, replies, recommendations, and mentions.
- Coupon utility that sends stored coupon codes to a member UID.
- Admin database page for users, content, important popup notices, guild-war season data, and main hero slider images.
- Main hero image carousel with admin-managed images, arrows, dots, and slide animation.
- Theme/settings panel for color themes and display preferences.

## Server

The production server runs with Node.js, Express, SQLite, PM2, and Nginx.

```bash
npm install
npm start
```

Local app URL:

```text
http://localhost:3000
```

## Important Files

- `server.js`: API server, auth, uploads, notices, posts, admin tools, coupons.
- `db.js`: SQLite schema and migrations.
- `app.js`: main page behavior, board filtering, notifications, hero carousel.
- `index.html`: main community page.
- `post.html`: post detail and comments.
- `upload.html`: post/PVE/PVP guide upload page.
- `notices.html`, `notices.js`, `notice-upload.html`: notice list and notice writing flow.
- `guild-war.html`, `guild-war-admin.html`, `guild-war.js`: guild-war sheet viewer/writer.
- `admin.html`, `admin.js`: admin dashboard.
- `coupon.html`, `coupon.js`: coupon sending tool.
- `styles.css`: shared site styling.

## Deployment Note

Typical deployment flow:

```bash
git pull origin main
pm2 restart bbibbi --update-env
```
