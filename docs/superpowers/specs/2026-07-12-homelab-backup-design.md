# Homelab Backup Solution: Restic + rclone → pCloud

**Date:** 2026-07-12
**Status:** Design

## Overview

Automatic daily encrypted backup of runtipi app-data (databases, configs, settings) from the Ubuntu VM (Proxmox) to pCloud cloud storage. Media files are excluded (too large for cloud at current bandwidth). Email notifications on failure.

## Architecture

```
Ubuntu VM (Proxmox)
├── /root/runtipi/app-data/     ← source (all app data)
│
├── restic backup (3 AM daily)
│   ├── encrypts (AES-256)
│   ├── deduplicates
│   ├── increments (only changes)
│   └── writes via rclone →
│
├── rclone → pCloud
│   └── pcloud-backup:runtipi-backup/  ← restic repository
│
├── msmtp (Gmail SMTP relay)
│   └── sends failure alerts
│
└── cron (3 AM daily)
    └── triggers backup script
```

## Components

### 1. rclone (pCloud connector)

- Installed via official binary
- Configured with pCloud remote using OAuth (authorized on local machine, token copied to server)
- Config file: `/root/.config/rclone/rclone.conf`
- Remote name: `pcloud-backup`

### 2. restic (encrypted deduplicated backup)

- Installed via official binary (or apt)
- Repository: `rclone:pcloud-backup:runtipi-backup`
- Encryption: strong password (stored in `/root/.restic-env`, chmod 600)
- Snapshots are incremental after first full backup
- Repository check runs weekly (Sundays)

### 3. msmtp (email notifications)

- Lightweight SMTP client
- Configured with Gmail SMTP (`smtp.gmail.com:587`, STARTTLS)
- Sender: user's Gmail account (app password)
- Recipient: user's chosen email
- Config file: `/root/.msmtprc` (chmod 600)

### 4. Backup script

**Location:** `/usr/local/bin/runtipi-backup.sh`

**Logic:**
1. Source restic env (password, repo path)
2. Run `restic backup /root/runtipi/app-data/`
3. Run `restic forget --keep-daily 7 --keep-weekly 5 --keep-monthly 12 --prune`
4. On Sundays: run `restic check` (repository integrity)
5. On any failure: send email alert via msmtp
6. Log all output to `/var/log/runtipi-backup.log`

### 5. Cron schedule

```
0 3 * * * /usr/local/bin/runtipi-backup.sh >> /var/log/runtipi-backup.log 2>&1
```

## Retention Policy

| Period | Keep |
|--------|------|
| Daily snapshots | 7 (last week) |
| Weekly snapshots | 5 (last ~5 weeks) |
| Monthly snapshots | 12 (last year) |

Older snapshots are pruned automatically. With deduplication, actual storage used is small (only changed blocks between snapshots).

## What Gets Backed Up

**Included:**
- `/root/runtipi/app-data/` — all app stores and apps
  - `migrated/` — flatnotes, linkwarden, hoarder (karakeep), jellyfin config, bazarr, etc.
  - `personal-store/` — invoice-generator database
  - `_user/` — byparr, infokeep

**Excluded (by design):**
- `/root/runtipi/media/` — 37 GB media library (too large for cloud backup at 10-50 Mbps upload; keep locally)
- `/root/runtipi/repos/` — app store repos (re-downloadable)
- System/VM-level data (use Proxmox vzdump for this)

## Restore Procedure

```bash
# List available snapshots
restic -r rclone:pcloud-backup:runtipi-backup snapshots

# Restore latest snapshot to a temp directory
restic -r rclone:pcloud-backup:runtipi-backup restore latest --target /tmp/restore

# Or restore specific files
restic -r rclone:pcloud-backup:runtipi-backup restore latest --target /tmp/restore --include /personal-store
```

After restore: stop the relevant app, copy data back to `/root/runtipi/app-data/`, restart app.

## Security

- Restic repository is encrypted with AES-256 (password never leaves the server)
- rclone config and restic env file are chmod 600
- msmtp config (contains Gmail app password) is chmod 600
- pCloud data is encrypted at rest by restic (pCloud sees only encrypted blobs)
- Backup script runs as root (needed to read app-data)

## Setup Prerequisites

1. **pCloud account** — already have
2. **rclone OAuth** — must run `rclone authorize "pcloud"` on a machine with a browser, then copy the token to the server
3. **Gmail app password** — generate at https://myaccount.google.com/apppasswords (2FA must be enabled)
4. **SSH access** to the server (already have)

## Failure Modes & Handling

| Failure | Behavior |
|---------|----------|
| Network down | Backup fails → email alert sent → retries next day |
| pCloud API error | Backup fails → email alert → check rclone config |
| Wrong restic password | Backup fails → email alert → critical, data inaccessible |
| Disk full (server) | Backup fails → email alert → check disk space |
| Cron not running | No alert (cron failure is silent) — monitor via log timestamps |

## Not Covered (Future Consideration)

- **Media backup:** Consider local USB drive, NAS, or Proxmox PBS for the 37 GB media library
- **Proxmox VM snapshots:** Set up vzdump for full VM disaster recovery
- **Backup verification:** Could add periodic test-restore automation
- **Multiple cloud providers:** Could add a second restic repo (e.g., Backblaze B2) for redundancy
