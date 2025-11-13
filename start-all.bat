@echo off
start "Backend" cmd /k "cd /d C:\Users\denni\WestWallet\backend && npm run start:dev"
start "MongoDB" cmd /k "mongod"
start "Frontend" cmd /k "cd /d C:\Users\denni\WestWallet\web && npm run dev"
