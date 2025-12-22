"""
Artvision Portal Telegram Bot
Mini App + уведомления для клиентов
"""

import os
import json
import logging
from datetime import datetime

# Для Vercel serverless
try:
    from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
    from telegram.ext import Application, CommandHandler, ContextTypes
except ImportError:
    print("pip install python-telegram-bot")

# Конфигурация
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "8570860596:AAG8sAPiClGDCGCQi8SMltJFGW5sRUcJdns")
WEBAPP_URL = os.environ.get("WEBAPP_URL", "https://artvision-portal.vercel.app")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Стартовое сообщение с Mini App"""
    
    keyboard = [
        [InlineKeyboardButton(
            "📊 Открыть портал",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )],
        [InlineKeyboardButton("📈 Позиции", callback_data="positions")],
        [InlineKeyboardButton("📄 Отчёты", callback_data="reports")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "👋 Добро пожаловать в Artvision Portal!\n\n"
        "Здесь вы можете:\n"
        "• Смотреть позиции сайта\n"
        "• Скачивать отчёты\n"
        "• Получать уведомления\n\n"
        "Нажмите кнопку ниже:",
        reply_markup=reply_markup
    )


async def positions(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать позиции"""
    # TODO: Подключить Supabase
    await update.message.reply_text(
        "📈 *Позиции в поиске*\n\n"
        "Данные обновляются ежедневно.\n"
        "Откройте портал для подробностей.",
        parse_mode="Markdown"
    )


async def reports(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать отчёты"""
    await update.message.reply_text(
        "📄 *Ваши отчёты*\n\n"
        "Последний отчёт: Декабрь 2025\n"
        "Статус: Готов к просмотру",
        parse_mode="Markdown"
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Помощь"""
    await update.message.reply_text(
        "🔹 /start — открыть портал\n"
        "🔹 /positions — позиции сайта\n"
        "🔹 /reports — отчёты\n"
        "🔹 /help — эта справка"
    )


def main():
    """Запуск бота"""
    app = Application.builder().token(BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("positions", positions))
    app.add_handler(CommandHandler("reports", reports))
    app.add_handler(CommandHandler("help", help_command))
    
    logger.info("Bot starting...")
    app.run_polling()


if __name__ == "__main__":
    main()
