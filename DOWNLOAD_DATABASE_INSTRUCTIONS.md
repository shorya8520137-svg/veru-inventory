# Download Database File - Instructions

## Option 1: WinSCP (Easiest for Windows) ⭐ RECOMMENDED

1. **Download WinSCP:**
   - Go to: https://winscp.net/eng/download.php
   - Download and install

2. **Connect to Server:**
   - Open WinSCP
   - Click "New Site"
   - Fill in:
     - File protocol: SFTP
     - Host name: `54.251.22.246`
     - Port: `22`
     - User name: `ubuntu`
     - Password: (your server password)
   - Click "Login"

3. **Download the File:**
   - Navigate to `/home/ubuntu/`
   - Find `inventory_backup_final.sql`
   - Drag it to your local folder
   - Or right-click → Download

## Option 2: FileZilla

1. **Download FileZilla:**
   - Go to: https://filezilla-project.org/
   - Download FileZilla Client

2. **Connect:**
   - Host: `sftp://54.251.22.246`
   - Username: `ubuntu`
   - Password: (your server password)
   - Port: `22`
   - Click "Quickconnect"

3. **Download:**
   - Navigate to `/home/ubuntu/`
   - Right-click `inventory_backup_final.sql`
   - Click "Download"

## Option 3: Setup SSH Key (For Future Use)

If you want to use command-line tools, you need to set up SSH key authentication:

1. **Generate SSH Key (if you don't have one):**
   ```powershell
   ssh-keygen -t rsa -b 4096
   ```
   Press Enter to accept defaults

2. **Copy Key to Server:**
   ```powershell
   type $env:USERPROFILE\.ssh\id_rsa.pub | ssh ubuntu@54.251.22.246 "cat >> ~/.ssh/authorized_keys"
   ```

3. **Then download:**
   ```powershell
   scp ubuntu@54.251.22.246:~/inventory_backup_final.sql ./
   ```

## File Details

- **Server:** 54.251.22.246
- **Username:** ubuntu
- **File Path:** `/home/ubuntu/inventory_backup_final.sql`
- **File Name:** `inventory_backup_final.sql`

## After Download

Once downloaded, you can:

1. **View file size:**
   ```powershell
   Get-Item inventory_backup_final.sql | Select Name, @{N="Size(MB)";E={[math]::Round($_.Length/1MB,2)}}
   ```

2. **Import to local MySQL (if needed):**
   ```bash
   mysql -u root -p -e "CREATE DATABASE inventory_db;"
   mysql -u root -p inventory_db < inventory_backup_final.sql
   ```

## Need Help?

If you're having trouble, the easiest way is to use WinSCP - it's a simple drag-and-drop interface!
