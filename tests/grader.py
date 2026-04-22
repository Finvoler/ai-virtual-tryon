import os
import re
import json
import sys

# ==========================================
# 🎨 终端颜色输出配置
# ==========================================
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_pass(msg, score):
    print(f"{Colors.GREEN}✅ PASS (+{score}分): {msg}{Colors.ENDC}")

def print_fail(msg):
    print(f"{Colors.FAIL}❌ FAIL (+0分): {msg}{Colors.ENDC}")

def print_header(msg):
    print(f"\n{Colors.HEADER}{Colors.BOLD}=== {msg} ==={Colors.ENDC}")

# ==========================================
# 📂 文件路径定义
# ==========================================
FILES = {
    "package": "package.json",
    "api_route": "app/api/clothes-swap/route.ts",
    "component": "components/ClothesSwapTool.tsx",
    "page": "app/page.tsx",
    "config": "next.config.ts" # 或 next.config.js
}

# ==========================================
# 🛠️ 辅助分析函数
# ==========================================
def read_file_content(filepath):
    """读取文件内容，若不存在返回 None"""
    if not os.path.exists(filepath):
        return None
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception:
        return None

def check_keyword(content, keywords):
    """检查内容中是否包含任一关键词"""
    if not content: return False
    for k in keywords:
        if k in content:
            return True
    return False

def check_regex(content, pattern):
    """正则匹配检查"""
    if not content: return False
    return re.search(pattern, content) is not None

# ==========================================
# 🚀 测评主逻辑
# ==========================================
def run_evaluation():
    total_score = 0
    max_score = 100
    
    print_header("AI Clothes Swapper 自动化构建评测")
    print(f"{Colors.BLUE}正在扫描项目结构与代码逻辑...{Colors.ENDC}")

    # ------------------------------------------------------------------
    # Part 1: 架构完整性 (System Architecture) - 20分
    # ------------------------------------------------------------------
    print_header("Part 1: 架构完整性 (System Architecture)")
    
    # 1.1 目录合规 (10分)
    # 检查核心文件是否存在于正确的 App Router 路径下
    missing_files = []
    for key, path in FILES.items():
        if key == 'config': continue # config文件名不确定，跳过严格检查
        if not os.path.exists(path):
            missing_files.append(path)
    
    if not missing_files:
        print_pass("Next.js App Router 目录结构合规", 10)
        total_score += 10
    else:
        print_fail(f"目录结构缺失文件: {missing_files}")

    # 1.2 依赖配置 (10分)
    # 检查 package.json 是否包含必需库
    pkg_content = read_file_content(FILES["package"])
    if pkg_content:
        required_deps = [
            "next", "react", "framer-motion", "replicate", 
            "react-dropzone", "clsx", "tailwind-merge"
        ]
        # 简单解析 json 或字符串匹配
        missing_deps = [dep for dep in required_deps if f'"{dep}"' not in pkg_content]
        
        if not missing_deps:
            print_pass("依赖配置完整 (AI SDK, Tailwind, UI Libs)", 10)
            total_score += 10
        else:
            # 允许少量缺失，视情况给分，这里严格处理
            print_fail(f"package.json 缺失依赖: {missing_deps}")
    else:
        print_fail("未找到 package.json")

    # ------------------------------------------------------------------
    # Part 2: 异步 AI 调度 (Async AI Orchestration) - 30分
    # ------------------------------------------------------------------
    print_header("Part 2: 异步 AI 调度 (Async AI Orchestration)")
    api_content = read_file_content(FILES["api_route"])

    if api_content:
        # 2.1 API 鲁棒性 (15分)
        # 检查 FormData 解析 和 Replicate 初始化
        has_form_data = check_regex(api_content, r'await\s+.*\.formData\(\)')
        has_replicate_init = check_regex(api_content, r'new\s+Replicate')
        has_token_env = check_regex(api_content, r'process\.env\.REPLICATE_API_TOKEN')
        
        if has_form_data and has_replicate_init and has_token_env:
            print_pass("API 逻辑鲁棒 (FormData解析 + Replicate鉴权)", 15)
            total_score += 15
        else:
            reason = []
            if not has_form_data: reason.append("缺失 formData 处理")
            if not has_replicate_init: reason.append("缺失 Replicate 实例")
            if not has_token_env: reason.append("未通过环境变量获取 Token")
            print_fail(f"API 基础逻辑缺陷: {', '.join(reason)}")

        # 2.2 异步流控 (15分)
        # 检查是否调用了模型，并且有 await 机制
        # IDM-VTON 通常需要几秒，如果没写 await 或 webhook，前端会拿不到结果
        has_run_or_predict = check_regex(api_content, r'replicate\.(run|predictions\.create)')
        # 检查是否有 await 关键字确保异步等待
        has_await_logic = check_regex(api_content, r'await')
        
        if has_run_or_predict and has_await_logic:
            print_pass("实现了异步流控与模型调用", 15)
            total_score += 15
        else:
            print_fail("未检测到有效的 Replicate 模型调用或异步等待逻辑")
    else:
        print_fail(f"未找到 API 文件: {FILES['api_route']}")

    # ------------------------------------------------------------------
    # Part 3: 交互体验 (User Experience) - 30分
    # ------------------------------------------------------------------
    print_header("Part 3: 交互体验 (User Experience)")
    ui_content = read_file_content(FILES["component"])

    if ui_content:
        # 3.1 状态机设计 (15分)
        # 检查是否有 loading/processing 状态 和 结果展示逻辑
        has_state_hook = check_regex(ui_content, r'useState')
        # 检查是否有处理中的标志位 (如 isProcessing, loading 等)
        has_loading_state = check_regex(ui_content, r'(isProcessing|isLoading|setLoading|status)')
        # 检查是否有 framer-motion 动画标签
        has_motion = check_regex(ui_content, r'<motion\.')
        
        if has_state_hook and has_loading_state and has_motion:
            print_pass("状态机完整且包含交互动画", 15)
            total_score += 15
        else:
            print_fail("UI 缺少状态管理或动画效果")

        # 3.2 文件验证 (15分)
        # 检查 react-dropzone 配置或手动校验逻辑
        # 检查 maxFiles, maxSize 或 accept
        has_dropzone_config = check_regex(ui_content, r'(useDropzone|Dropzone)')
        has_validation = check_regex(ui_content, r'(maxSize|accept|10.*1024.*1024)') # 检查是否有大小限制代码
        
        if has_dropzone_config and has_validation:
            print_pass("实现了文件类型与大小校验", 15)
            total_score += 15
        else:
            print_fail("缺失文件上传校验逻辑")
    else:
        print_fail(f"未找到组件文件: {FILES['component']}")

    # ------------------------------------------------------------------
    # Part 4: 性能与 SEO (Performance & SEO) - 20分
    # ------------------------------------------------------------------
    print_header("Part 4: 性能与 SEO (Performance & SEO)")
    page_content = read_file_content(FILES["page"])

    if page_content:
        # 4.1 生产就绪度 (20分)
        # 检查 Metadata
        has_metadata = check_regex(page_content, r'export const metadata')
        
        # 安全检查：检查整个项目（除了 .env）是否有硬编码的 Token
        # 扫描 pattern r8_xxxxxx (Replicate token 通常格式)
        security_risk = False
        all_code = (api_content or "") + (ui_content or "") + (page_content or "")
        # Replicate keys start with r8_ and are long
        if re.search(r'[\'"]r8_[a-zA-Z0-9]{10,}[\'"]', all_code):
            security_risk = True
            
        if has_metadata and not security_risk:
            print_pass("SEO Metadata 完整且无敏感信息泄露", 20)
            total_score += 20
        else:
            reason = []
            if not has_metadata: reason.append("缺失 Metadata")
            if security_risk: reason.append("⚠️ 发现硬编码的 API Token (严重安全风险)")
            print_fail(f"生产环境检查未通过: {', '.join(reason)}")
    else:
        print_fail(f"未找到首页文件: {FILES['page']}")

    # ==========================================
    # 🏆 最终总结
    # ==========================================
    print("\n" + "="*50)
    print(f"📊 最终得分: {total_score} / {max_score}")
    print("="*50)

    if total_score == 100:
        print(f"{Colors.GREEN}🌟 完美！架构标准，逻辑闭环，安全合规。{Colors.ENDC}")
    elif total_score >= 80:
        print(f"{Colors.BLUE}👍 优秀！只需微调细节即可上线。{Colors.ENDC}")
    else:
        print(f"{Colors.WARNING}🔧 需要优化：请检查缺失的文件或逻辑漏洞。{Colors.ENDC}")

if __name__ == "__main__":
    # 检查是否在项目根目录运行
    if not os.path.exists("package.json"):
        print(f"{Colors.WARNING}提示: 未在当前目录找到 package.json，将尝试运行评测，但大概率会失败。{Colors.ENDC}")
        print(f"{Colors.WARNING}请确保你已将生成的代码保存为对应的文件结构。{Colors.ENDC}")
    
    run_evaluation()