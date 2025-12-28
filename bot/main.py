"""
Artvision Portal Bot v2.0
Mini App для клиентов + Анализатор задач для команды

Команды клиентов:
    /start - Открыть портал
    /positions - Позиции сайта
    /reports - Отчёты

Команды админов:
    /analyze - Анализ загрузки команды
    /workload - Кто перегружен
    /tasks - Задачи без сроков/исполнителей
    /overdue - Просроченные задачи
"""

import os
import json
import logging
import httpx
from datetime import datetime, timedelta
from typing import Optional, List, Dict

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
)

# ═══════════════════════════════════════════════════════════════
# КОНФИГУРАЦИЯ
# ═══════════════════════════════════════════════════════════════

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "8570860596:AAG8sAPiClGDCGCQi8SMltJFGW5sRUcJdns")
WEBAPP_URL = os.environ.get("WEBAPP_URL", "https://artvision-portal.vercel.app/webapp")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# Asana
ASANA_TOKEN = os.environ.get("ASANA_TOKEN", "")
ASANA_WORKSPACE = os.environ.get("ASANA_WORKSPACE", "860693669973770")
ASANA_PROJECT = os.environ.get("ASANA_PROJECT", "1212305892582815")  # Задачи - Artvision

# Админы (Telegram user IDs)
ADMIN_IDS = [int(x) for x in os.environ.get("ADMIN_IDS", "161261562").split(",") if x]
# Кирилл: 161261562

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# ASANA API
# ═══════════════════════════════════════════════════════════════

class AsanaClient:
    """Клиент для работы с Asana API"""
    
    BASE_URL = "https://app.asana.com/api/1.0"
    
    def __init__(self, token: str):
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    async def get_tasks(
        self, 
        project_id: str = None,
        assignee: str = None,
        completed: bool = False,
        opt_fields: str = "name,due_on,assignee,assignee.name,completed,created_at,notes"
    ) -> List[Dict]:
        """Получить задачи"""
        params = {
            "opt_fields": opt_fields,
            "completed_since": "now" if not completed else None
        }
        
        if project_id:
            params["project"] = project_id
        if assignee:
            params["assignee"] = assignee
            params["workspace"] = ASANA_WORKSPACE
            
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/tasks",
                headers=self.headers,
                params={k: v for k, v in params.items() if v}
            )
            data = resp.json()
            return data.get("data", [])
    
    async def get_users(self, workspace_id: str) -> List[Dict]:
        """Получить пользователей воркспейса"""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/workspaces/{workspace_id}/users",
                headers=self.headers,
                params={"opt_fields": "name,email"}
            )
            data = resp.json()
            return data.get("data", [])
    
    async def search_tasks(
        self,
        workspace_id: str,
        text: str = None,
        assignee: str = None,
        due_on_before: str = None,
        completed: bool = False
    ) -> List[Dict]:
        """Поиск задач"""
        params = {
            "opt_fields": "name,due_on,assignee,assignee.name,completed"
        }
        if text:
            params["text"] = text
        if assignee:
            params["assignee.any"] = assignee
        if due_on_before:
            params["due_on.before"] = due_on_before
        if not completed:
            params["completed"] = "false"
            
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/workspaces/{workspace_id}/tasks/search",
                headers=self.headers,
                params=params
            )
            data = resp.json()
            return data.get("data", [])


# ═══════════════════════════════════════════════════════════════
# АНАЛИЗАТОР ЗАДАЧ
# ═══════════════════════════════════════════════════════════════

class TaskAnalyzer:
    """Анализатор загрузки и задач"""
    
    def __init__(self, asana: AsanaClient):
        self.asana = asana
    
    async def analyze_workload(self) -> Dict:
        """Анализ загрузки команды"""
        tasks = await self.asana.get_tasks(project_id=ASANA_PROJECT)
        
        # Группируем по исполнителям
        by_assignee = {}
        no_assignee = []
        no_due_date = []
        overdue = []
        
        today = datetime.now().date()
        
        for task in tasks:
            if task.get("completed"):
                continue
                
            assignee = task.get("assignee")
            due_on = task.get("due_on")
            
            # Без исполнителя
            if not assignee:
                no_assignee.append(task)
            else:
                name = assignee.get("name", "Unknown")
                if name not in by_assignee:
                    by_assignee[name] = []
                by_assignee[name].append(task)
            
            # Без дедлайна
            if not due_on:
                no_due_date.append(task)
            else:
                # Просроченные
                due = datetime.strptime(due_on, "%Y-%m-%d").date()
                if due < today:
                    overdue.append(task)
        
        return {
            "by_assignee": by_assignee,
            "no_assignee": no_assignee,
            "no_due_date": no_due_date,
            "overdue": overdue,
            "total_active": len([t for t in tasks if not t.get("completed")])
        }
    
    def format_workload_report(self, analysis: Dict) -> str:
        """Форматирование отчёта о загрузке"""
        lines = ["📊 *Анализ загрузки команды*\n"]
        
        # По исполнителям
        lines.append("👥 *По специалистам:*")
        for name, tasks in sorted(
            analysis["by_assignee"].items(), 
            key=lambda x: -len(x[1])
        ):
            count = len(tasks)
            emoji = "🔴" if count > 10 else "🟡" if count > 5 else "🟢"
            lines.append(f"  {emoji} {name}: {count} задач")
        
        # Проблемы
        lines.append("\n⚠️ *Требуют внимания:*")
        
        if analysis["no_assignee"]:
            lines.append(f"  ❌ Без исполнителя: {len(analysis['no_assignee'])}")
            
        if analysis["no_due_date"]:
            lines.append(f"  ❌ Без дедлайна: {len(analysis['no_due_date'])}")
            
        if analysis["overdue"]:
            lines.append(f"  🔥 Просрочено: {len(analysis['overdue'])}")
        
        lines.append(f"\n📈 Всего активных: {analysis['total_active']}")
        
        return "\n".join(lines)
    
    def format_tasks_list(self, tasks: List[Dict], title: str) -> str:
        """Форматирование списка задач"""
        if not tasks:
            return f"✅ {title}: нет задач"
        
        lines = [f"📋 *{title}* ({len(tasks)})\n"]
        
        for i, task in enumerate(tasks[:15], 1):  # Максимум 15
            name = task.get("name", "Без названия")[:40]
            due = task.get("due_on", "без срока")
            assignee = task.get("assignee", {})
            who = assignee.get("name", "—") if assignee else "—"
            
            lines.append(f"{i}. {name}")
            lines.append(f"   📅 {due} | 👤 {who}")
        
        if len(tasks) > 15:
            lines.append(f"\n... и ещё {len(tasks) - 15}")
        
        return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════
# ПРОВЕРКА ПРАВ
# ═══════════════════════════════════════════════════════════════

def is_admin(user_id: int) -> bool:
    """Проверка админских прав"""
    return user_id in ADMIN_IDS


def admin_required(func):
    """Декоратор для админских команд"""
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = update.effective_user.id
        if not is_admin(user_id):
            await update.message.reply_text(
                "⛔ Эта команда доступна только администраторам.\n\n"
                f"Ваш ID: `{user_id}`\n"
                "Попросите админа добавить вас в ADMIN_IDS.",
                parse_mode="Markdown"
            )
            return
        return await func(update, context)
    return wrapper


# ═══════════════════════════════════════════════════════════════
# КОМАНДЫ КЛИЕНТОВ
# ═══════════════════════════════════════════════════════════════

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Стартовое сообщение"""
    user_id = update.effective_user.id
    
    # Базовые кнопки для всех
    keyboard = [
        [InlineKeyboardButton(
            "📊 Открыть портал",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )],
        [InlineKeyboardButton("📈 Позиции", callback_data="positions")],
        [InlineKeyboardButton("📄 Отчёты", callback_data="reports")],
    ]
    
    # Дополнительные кнопки для админов
    if is_admin(user_id):
        keyboard.append([
            InlineKeyboardButton("⚙️ Админ-панель", callback_data="admin_panel")
        ])
    
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
    user_id = update.effective_user.id
    
    text = (
        "🔹 /start — открыть портал\n"
        "🔹 /positions — позиции сайта\n"
        "🔹 /reports — отчёты\n"
        "🔹 /help — эта справка"
    )
    
    if is_admin(user_id):
        text += (
            "\n\n*Админ-команды:*\n"
            "🔸 /analyze — анализ загрузки\n"
            "🔸 /workload — кто перегружен\n"
            "🔸 /tasks — без исполнителя\n"
            "🔸 /overdue — просроченные\n"
            "🔸 /nodue — без дедлайна"
        )
    
    await update.message.reply_text(text, parse_mode="Markdown")


# ═══════════════════════════════════════════════════════════════
# КОМАНДЫ АДМИНОВ
# ═══════════════════════════════════════════════════════════════

@admin_required
async def analyze(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Полный анализ загрузки"""
    await update.message.reply_text("⏳ Анализирую задачи...")
    
    if not ASANA_TOKEN:
        await update.message.reply_text(
            "❌ ASANA_TOKEN не настроен!\n"
            "Добавьте токен в переменные окружения."
        )
        return
    
    try:
        asana = AsanaClient(ASANA_TOKEN)
        analyzer = TaskAnalyzer(asana)
        
        analysis = await analyzer.analyze_workload()
        report = analyzer.format_workload_report(analysis)
        
        # Кнопки для детализации
        keyboard = [
            [
                InlineKeyboardButton("❌ Без исполнителя", callback_data="show_no_assignee"),
                InlineKeyboardButton("📅 Без дедлайна", callback_data="show_no_due")
            ],
            [
                InlineKeyboardButton("🔥 Просроченные", callback_data="show_overdue")
            ]
        ]
        
        await update.message.reply_text(
            report,
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        
    except Exception as e:
        logger.error(f"Analyze error: {e}")
        await update.message.reply_text(f"❌ Ошибка: {e}")


@admin_required
async def workload(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Загрузка по специалистам"""
    await update.message.reply_text("⏳ Считаю загрузку...")
    
    if not ASANA_TOKEN:
        await update.message.reply_text("❌ ASANA_TOKEN не настроен!")
        return
    
    try:
        asana = AsanaClient(ASANA_TOKEN)
        analyzer = TaskAnalyzer(asana)
        
        analysis = await analyzer.analyze_workload()
        
        lines = ["👥 *Загрузка специалистов*\n"]
        
        for name, tasks in sorted(
            analysis["by_assignee"].items(),
            key=lambda x: -len(x[1])
        ):
            count = len(tasks)
            bar = "█" * min(count, 15) + "░" * max(0, 15 - count)
            emoji = "🔴" if count > 10 else "🟡" if count > 5 else "🟢"
            lines.append(f"{emoji} *{name}*: {count}")
            lines.append(f"  `{bar}`")
            
            # Ближайшие дедлайны
            upcoming = [t for t in tasks if t.get("due_on")]
            upcoming.sort(key=lambda x: x["due_on"])
            if upcoming[:2]:
                lines.append("  Ближайшее:")
                for t in upcoming[:2]:
                    lines.append(f"  • {t['name'][:30]} ({t['due_on']})")
            lines.append("")
        
        await update.message.reply_text("\n".join(lines), parse_mode="Markdown")
        
    except Exception as e:
        logger.error(f"Workload error: {e}")
        await update.message.reply_text(f"❌ Ошибка: {e}")


@admin_required
async def tasks_no_assignee(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Задачи без исполнителя"""
    await update.message.reply_text("⏳ Ищу задачи без исполнителя...")
    
    if not ASANA_TOKEN:
        await update.message.reply_text("❌ ASANA_TOKEN не настроен!")
        return
    
    try:
        asana = AsanaClient(ASANA_TOKEN)
        analyzer = TaskAnalyzer(asana)
        
        analysis = await analyzer.analyze_workload()
        report = analyzer.format_tasks_list(
            analysis["no_assignee"],
            "Без исполнителя"
        )
        
        await update.message.reply_text(report, parse_mode="Markdown")
        
    except Exception as e:
        await update.message.reply_text(f"❌ Ошибка: {e}")


@admin_required
async def tasks_overdue(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Просроченные задачи"""
    await update.message.reply_text("⏳ Ищу просроченные...")
    
    if not ASANA_TOKEN:
        await update.message.reply_text("❌ ASANA_TOKEN не настроен!")
        return
    
    try:
        asana = AsanaClient(ASANA_TOKEN)
        analyzer = TaskAnalyzer(asana)
        
        analysis = await analyzer.analyze_workload()
        report = analyzer.format_tasks_list(
            analysis["overdue"],
            "🔥 Просроченные задачи"
        )
        
        await update.message.reply_text(report, parse_mode="Markdown")
        
    except Exception as e:
        await update.message.reply_text(f"❌ Ошибка: {e}")


@admin_required
async def tasks_no_due(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Задачи без дедлайна"""
    await update.message.reply_text("⏳ Ищу задачи без срока...")
    
    if not ASANA_TOKEN:
        await update.message.reply_text("❌ ASANA_TOKEN не настроен!")
        return
    
    try:
        asana = AsanaClient(ASANA_TOKEN)
        analyzer = TaskAnalyzer(asana)
        
        analysis = await analyzer.analyze_workload()
        report = analyzer.format_tasks_list(
            analysis["no_due_date"],
            "Без дедлайна"
        )
        
        await update.message.reply_text(report, parse_mode="Markdown")
        
    except Exception as e:
        await update.message.reply_text(f"❌ Ошибка: {e}")


# ═══════════════════════════════════════════════════════════════
# CALLBACK HANDLERS
# ═══════════════════════════════════════════════════════════════

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка нажатий кнопок"""
    query = update.callback_query
    await query.answer()
    
    user_id = query.from_user.id
    data = query.data
    
    if data == "positions":
        await query.message.reply_text(
            "📈 *Позиции в поиске*\n\n"
            "Данные обновляются ежедневно.\n"
            "Откройте портал для подробностей.",
            parse_mode="Markdown"
        )
    
    elif data == "reports":
        await query.message.reply_text(
            "📄 *Ваши отчёты*\n\n"
            "Последний отчёт: Декабрь 2025\n"
            "Статус: Готов к просмотру",
            parse_mode="Markdown"
        )
    
    elif data == "admin_panel" and is_admin(user_id):
        keyboard = [
            [InlineKeyboardButton("📊 Анализ загрузки", callback_data="run_analyze")],
            [InlineKeyboardButton("👥 По специалистам", callback_data="run_workload")],
            [
                InlineKeyboardButton("❌ Без исп.", callback_data="run_no_assignee"),
                InlineKeyboardButton("📅 Без срока", callback_data="run_no_due")
            ],
            [InlineKeyboardButton("🔥 Просроченные", callback_data="run_overdue")]
        ]
        await query.message.reply_text(
            "⚙️ *Админ-панель*\n\nВыберите действие:",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    
    # Админские callback-и
    elif data.startswith("run_") and is_admin(user_id):
        action = data.replace("run_", "")
        
        if not ASANA_TOKEN:
            await query.message.reply_text("❌ ASANA_TOKEN не настроен!")
            return
        
        await query.message.reply_text("⏳ Загружаю данные...")
        
        try:
            asana = AsanaClient(ASANA_TOKEN)
            analyzer = TaskAnalyzer(asana)
            analysis = await analyzer.analyze_workload()
            
            if action == "analyze":
                report = analyzer.format_workload_report(analysis)
            elif action == "workload":
                lines = ["👥 *Загрузка:*\n"]
                for name, tasks in sorted(analysis["by_assignee"].items(), key=lambda x: -len(x[1])):
                    emoji = "🔴" if len(tasks) > 10 else "🟡" if len(tasks) > 5 else "🟢"
                    lines.append(f"{emoji} {name}: {len(tasks)}")
                report = "\n".join(lines)
            elif action == "no_assignee":
                report = analyzer.format_tasks_list(analysis["no_assignee"], "Без исполнителя")
            elif action == "no_due":
                report = analyzer.format_tasks_list(analysis["no_due_date"], "Без дедлайна")
            elif action == "overdue":
                report = analyzer.format_tasks_list(analysis["overdue"], "🔥 Просроченные")
            else:
                report = "❓ Неизвестное действие"
            
            await query.message.reply_text(report, parse_mode="Markdown")
            
        except Exception as e:
            await query.message.reply_text(f"❌ Ошибка: {e}")
    
    elif data.startswith("show_") and is_admin(user_id):
        # Для кнопок после /analyze
        action = data.replace("show_", "")
        
        try:
            asana = AsanaClient(ASANA_TOKEN)
            analyzer = TaskAnalyzer(asana)
            analysis = await analyzer.analyze_workload()
            
            if action == "no_assignee":
                report = analyzer.format_tasks_list(analysis["no_assignee"], "Без исполнителя")
            elif action == "no_due":
                report = analyzer.format_tasks_list(analysis["no_due_date"], "Без дедлайна")
            elif action == "overdue":
                report = analyzer.format_tasks_list(analysis["overdue"], "🔥 Просроченные")
            else:
                report = "❓"
            
            await query.message.reply_text(report, parse_mode="Markdown")
            
        except Exception as e:
            await query.message.reply_text(f"❌ Ошибка: {e}")


# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

def main():
    """Запуск бота"""
    app = Application.builder().token(BOT_TOKEN).build()
    
    # Команды клиентов
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("positions", positions))
    app.add_handler(CommandHandler("reports", reports))
    app.add_handler(CommandHandler("help", help_command))
    
    # Команды админов
    app.add_handler(CommandHandler("analyze", analyze))
    app.add_handler(CommandHandler("workload", workload))
    app.add_handler(CommandHandler("tasks", tasks_no_assignee))
    app.add_handler(CommandHandler("overdue", tasks_overdue))
    app.add_handler(CommandHandler("nodue", tasks_no_due))
    
    # Callback для кнопок
    app.add_handler(CallbackQueryHandler(button_callback))
    
    logger.info("🚀 Artvision Portal Bot v2.0 starting...")
    logger.info(f"   Admins: {ADMIN_IDS}")
    logger.info(f"   Asana: {'✓' if ASANA_TOKEN else '✗'}")
    
    app.run_polling()


if __name__ == "__main__":
    main()


