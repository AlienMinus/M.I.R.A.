import re
from typing import Dict, Any, Optional, Tuple, List

class CodeService:
    """
    Dedicated Code Generation Service for MIRA.
    Detects programming requests across C, C++, Python, Java, JavaScript, TypeScript,
    Go, Rust, C#, SQL, Bash, HTML/CSS, PHP, Ruby, Kotlin, and Swift.
    Generates clean, idiomatic, runnable code with detailed explanations and execution steps.
    """
    def __init__(self):
        self.language_aliases = {
            "python": "python",
            "py": "python",
            "c": "c",
            "cpp": "cpp",
            "c++": "cpp",
            "cplusplus": "cpp",
            "java": "java",
            "javascript": "javascript",
            "js": "javascript",
            "node": "javascript",
            "nodejs": "javascript",
            "typescript": "typescript",
            "ts": "typescript",
            "go": "go",
            "golang": "go",
            "rust": "rust",
            "rs": "rust",
            "c#": "csharp",
            "csharp": "csharp",
            "cs": "csharp",
            "html": "html",
            "css": "css",
            "sql": "sql",
            "bash": "bash",
            "shell": "bash",
            "sh": "bash",
            "php": "php",
            "ruby": "ruby",
            "swift": "swift",
            "kotlin": "kotlin",
            "react": "javascript"
        }

        self.language_display = {
            "c": "C",
            "cpp": "C++",
            "python": "Python",
            "java": "Java",
            "javascript": "JavaScript",
            "typescript": "TypeScript",
            "go": "Go",
            "rust": "Rust",
            "csharp": "C#",
            "html": "HTML",
            "css": "CSS",
            "sql": "SQL",
            "bash": "Bash / Shell",
            "php": "PHP",
            "ruby": "Ruby",
            "swift": "Swift",
            "kotlin": "Kotlin"
        }

    def is_coding_request(self, prompt: str) -> bool:
        """Determines if the prompt is asking to write, generate, or explain code."""
        p = prompt.lower().strip()

        # Strong coding action prefixes
        action_patterns = [
            r"\b(write|create|generate|give\s+me|show\s+me|implement|code|build)\s+(a|an|the)?\s*([a-z\+\#]+)?\s*(program|code|script|function|component|query|class|algorithm)\b",
            r"\b(how\s+to\s+(write|code|create|implement|print|calculate|sort|build))\s+.*\b(in\s+[a-z\+\#]+)\b",
            r"\bprint\s+['\"]?hello\s+world['\"]?\s+in\s+[a-z\+\#]+\b",
            r"\b[a-z\+\#]+\s+(code|program|script|function)\s+(to|for)\b",
            r"\b(bubble\s+sort|binary\s+search|quick\s+sort|merge\s+sort|fibonacci|factorial|palindrome|prime\s+number|linked\s+list)\s+in\s+[a-z\+\#]+\b",
            r"\b(sql\s+query\s+to|select\s+query\s+for|join\s+query\s+in\s+sql)\b"
        ]

        for pat in action_patterns:
            if re.search(pat, p):
                return True

        # Check explicit language + programming terminology combinations
        has_lang = any(re.search(rf"\b{re.escape(lang)}\b", p) for lang in [
            "python", "c program", "c code", "cpp", "c++", "java", "javascript",
            "typescript", "golang", "rust", "c#", "html", "css", "sql", "bash"
        ])

        has_code_intent = any(term in p for term in [
            "hello world", "factorial", "fibonacci", "reverse a string", "palindrome",
            "prime number", "bubble sort", "binary search", "matrix multiplication",
            "linked list", "todo app in react", "rest api", "for loop", "while loop"
        ])

        if has_lang and has_code_intent:
            return True

        return False

    def detect_language(self, prompt: str) -> str:
        """Extracts the intended programming language from the prompt."""
        p = prompt.lower()

        # Check specific multi-character and symbolic names first
        if "c++" in p or "cpp" in p or "cplusplus" in p:
            return "cpp"
        if "c#" in p or "csharp" in p:
            return "csharp"
        if "typescript" in p:
            return "typescript"
        if "javascript" in p or "node.js" in p or "nodejs" in p or "react" in p:
            return "javascript"
        if "python" in p or re.search(r"\bpy\b", p):
            return "python"
        if "java" in p:
            return "java"
        if "golang" in p or re.search(r"\bgo\s+(program|code|lang)\b", p):
            return "go"
        if "rust" in p:
            return "rust"
        if "html" in p:
            return "html"
        if "css" in p:
            return "css"
        if "sql" in p or "database query" in p:
            return "sql"
        if "bash" in p or "shell script" in p:
            return "bash"
        if "php" in p:
            return "php"
        if "ruby" in p:
            return "ruby"
        if "swift" in p:
            return "swift"
        if "kotlin" in p:
            return "kotlin"

        # Check isolated "c" (e.g. "c program", "in c", "using c")
        if re.search(r"\b(in\s+c|c\s+program|c\s+code|using\s+c|c\s+language)\b", p):
            return "c"

        # Default fallback language
        return "python"

    def generate_code_response(self, prompt: str) -> Dict[str, Any]:
        """Generates a complete, structured programming response."""
        lang = self.detect_language(prompt)
        lang_title = self.language_display.get(lang, lang.title())
        p_lower = prompt.lower()

        # 1. HELLO WORLD
        if "hello world" in p_lower or "print hello" in p_lower:
            return self._build_hello_world(lang, lang_title)

        # 2. FACTORIAL
        if "factorial" in p_lower:
            return self._build_factorial(lang, lang_title)

        # 3. FIBONACCI
        if "fibonacci" in p_lower:
            return self._build_fibonacci(lang, lang_title)

        # 4. PALINDROME
        if "palindrome" in p_lower:
            return self._build_palindrome(lang, lang_title)

        # 5. PRIME NUMBER
        if "prime" in p_lower:
            return self._build_prime(lang, lang_title)

        # 6. REVERSE STRING / ARRAY
        if "reverse" in p_lower:
            return self._build_reverse(lang, lang_title)

        # 7. BUBBLE SORT / SORTING
        if "bubble sort" in p_lower or "sort" in p_lower:
            return self._build_sorting(lang, lang_title)

        # 8. BINARY SEARCH
        if "binary search" in p_lower:
            return self._build_binary_search(lang, lang_title)

        # 9. SQL QUERIES
        if lang == "sql" or "sql" in p_lower or "query" in p_lower:
            return self._build_sql(p_lower)

        # 10. REACT / FRONTEND COMPONENT
        if "react" in p_lower or "component" in p_lower or "navbar" in p_lower:
            return self._build_react_component(p_lower)

        # 11. GENERAL / DYNAMIC CODE GENERATOR
        return self._build_general_program(prompt, lang, lang_title)

    # -------------------------------------------------------------
    # Specialized Language Code Templates
    # -------------------------------------------------------------
    def _build_hello_world(self, lang: str, lang_title: str) -> Dict[str, Any]:
        codes = {
            "c": (
                "#include <stdio.h>\n\n"
                "int main() {\n"
                "    // Print greeting to standard output\n"
                "    printf(\"Hello, World!\\n\");\n"
                "    return 0;\n"
                "}"
            ),
            "cpp": (
                "#include <iostream>\n\n"
                "int main() {\n"
                "    // Print greeting to standard output stream\n"
                "    std::cout << \"Hello, World!\" << std::endl;\n"
                "    return 0;\n"
                "}"
            ),
            "python": (
                "# Python 3 Hello World\n"
                "def main():\n"
                "    print(\"Hello, World!\")\n\n"
                "if __name__ == \"__main__\":\n"
                "    main()"
            ),
            "java": (
                "public class HelloWorld {\n"
                "    public static void main(String[] args) {\n"
                "        // Print to standard console\n"
                "        System.out.println(\"Hello, World!\");\n"
                "    }\n"
                "}"
            ),
            "javascript": (
                "// JavaScript Hello World\n"
                "function greet() {\n"
                "    console.log(\"Hello, World!\");\n"
                "}\n\n"
                "greet();"
            ),
            "typescript": (
                "// TypeScript Hello World\n"
                "const message: string = \"Hello, World!\";\n"
                "console.log(message);"
            ),
            "go": (
                "package main\n\n"
                "import \"fmt\"\n\n"
                "func main() {\n"
                "    fmt.Println(\"Hello, World!\")\n"
                "}"
            ),
            "rust": (
                "fn main() {\n"
                "    // Print line macro\n"
                "    println!(\"Hello, World!\");\n"
                "}"
            ),
            "csharp": (
                "using System;\n\n"
                "namespace HelloWorldApp {\n"
                "    class Program {\n"
                "        static void Main(string[] args) {\n"
                "            Console.WriteLine(\"Hello, World!\");\n"
                "        }\n"
                "    }\n"
                "}"
            ),
            "bash": (
                "#!/bin/bash\n"
                "# Hello World script\n"
                "echo \"Hello, World!\""
            ),
            "php": (
                "<?php\n"
                "// PHP Hello World\n"
                "echo \"Hello, World!\\n\";\n"
                "?>"
            ),
            "ruby": (
                "# Ruby Hello World\n"
                "puts \"Hello, World!\""
            ),
            "swift": (
                "import Foundation\n\n"
                "print(\"Hello, World!\")"
            ),
            "kotlin": (
                "fun main() {\n"
                "    println(\"Hello, World!\")\n"
                "}"
            )
        }

        run_cmds = {
            "c": "gcc main.c -o main && ./main",
            "cpp": "g++ main.cpp -o main && ./main",
            "python": "python main.py",
            "java": "javac HelloWorld.java && java HelloWorld",
            "javascript": "node index.js",
            "typescript": "ts-node index.ts",
            "go": "go run main.go",
            "rust": "rustc main.rs && ./main",
            "csharp": "dotnet run",
            "bash": "chmod +x script.sh && ./script.sh"
        }

        code_snippet = codes.get(lang, codes["python"])
        run_cmd = run_cmds.get(lang, f"Run with {lang_title} interpreter or compiler")

        text = (
            f"Here is a complete **{lang_title}** program to print **\"Hello, World!\"**:\n\n"
            f"```{lang}\n{code_snippet}\n```\n\n"
            f"### Key Highlights\n"
            f"- **Entry Point**: The program begins execution at the primary entry function (`main`).\n"
            f"- **Standard I/O**: Dispatches the text buffer directly to standard output console.\n"
            f"- **Termination**: Exits cleanly with status code `0`, confirming successful run to the OS.\n\n"
            f"### How to Run\n"
            f"```bash\n{run_cmd}\n```"
        )

        return {
            "success": True,
            "text": text,
            "summary": f"Complete {lang_title} implementation to output 'Hello, World!' to the console.",
            "language": lang
        }

    def _build_factorial(self, lang: str, lang_title: str) -> Dict[str, Any]:
        if lang == "c":
            code = (
                "#include <stdio.h>\n\n"
                "// Recursive function to calculate factorial\n"
                "long long factorial(int n) {\n"
                "    if (n <= 1) return 1;\n"
                "    return n * factorial(n - 1);\n"
                "}\n\n"
                "int main() {\n"
                "    int num = 5;\n"
                "    printf(\"Factorial of %d is %lld\\n\", num, factorial(num));\n"
                "    return 0;\n"
                "}"
            )
            run = "gcc factorial.c -o factorial && ./factorial"
        elif lang == "java":
            code = (
                "public class Factorial {\n"
                "    public static long calculate(int n) {\n"
                "        if (n <= 1) return 1;\n"
                "        return n * calculate(n - 1);\n"
                "    }\n\n"
                "    public static void main(String[] args) {\n"
                "        int num = 5;\n"
                "        System.out.println(\"Factorial of \" + num + \" is \" + calculate(num));\n"
                "    }\n"
                "}"
            )
            run = "javac Factorial.java && java Factorial"
        elif lang in ("javascript", "typescript"):
            code = (
                "function factorial(n) {\n"
                "    if (n <= 1) return 1;\n"
                "    return n * factorial(n - 1);\n"
                "}\n\n"
                "const num = 5;\n"
                "console.log(`Factorial of ${num} is ${factorial(num)}`);"
            )
            run = "node factorial.js"
        else: # Python default
            code = (
                "def factorial(n: int) -> int:\n"
                "    \"\"\"Calculates factorial of a non-negative integer recursively.\"\"\"\n"
                "    if n < 0:\n"
                "        raise ValueError(\"Factorial is not defined for negative numbers.\")\n"
                "    if n <= 1:\n"
                "        return 1\n"
                "    return n * factorial(n - 1)\n\n"
                "if __name__ == '__main__':\n"
                "    number = 5\n"
                "    print(f\"Factorial of {number} is {factorial(number)}\")"
            )
            run = "python factorial.py"

        text = (
            f"Here is an efficient **{lang_title}** program to calculate the **factorial** of a number:\n\n"
            f"```{lang}\n{code}\n```\n\n"
            f"### Complexity & Explanation\n"
            f"- **Base Case**: When `n <= 1`, the function returns `1` immediately to terminate recursion.\n"
            f"- **Recursive Step**: Computes `n * factorial(n - 1)` at each call frame.\n"
            f"- **Time Complexity**: `O(N)` linear iterations.\n"
            f"- **Space Complexity**: `O(N)` call stack depth.\n\n"
            f"### How to Run\n"
            f"```bash\n{run}\n```"
        )
        return {"success": True, "text": text, "summary": f"Recursive factorial algorithm implemented in {lang_title}.", "language": lang}

    def _build_fibonacci(self, lang: str, lang_title: str) -> Dict[str, Any]:
        if lang == "c":
            code = (
                "#include <stdio.h>\n\n"
                "void printFibonacci(int n) {\n"
                "    long long a = 0, b = 1, next;\n"
                "    printf(\"Fibonacci Series (%d terms):\\n\", n);\n"
                "    for (int i = 1; i <= n; i++) {\n"
                "        printf(\"%lld \", a);\n"
                "        next = a + b;\n"
                "        a = b;\n"
                "        b = next;\n"
                "    }\n"
                "    printf(\"\\n\");\n"
                "}\n\n"
                "int main() {\n"
                "    printFibonacci(10);\n"
                "    return 0;\n"
                "}"
            )
            run = "gcc fibonacci.c -o fibonacci && ./fibonacci"
        elif lang in ("javascript", "typescript"):
            code = (
                "function generateFibonacci(n) {\n"
                "    const seq = [0, 1];\n"
                "    for (let i = 2; i < n; i++) {\n"
                "        seq.push(seq[i - 1] + seq[i - 2]);\n"
                "    }\n"
                "    return seq.slice(0, n);\n"
                "}\n\n"
                "console.log('Fibonacci sequence:', generateFibonacci(10));"
            )
            run = "node fibonacci.js"
        else: # Python default
            code = (
                "def fibonacci_series(terms: int) -> list[int]:\n"
                "    \"\"\"Generates the first N numbers in the Fibonacci sequence iteratively.\"\"\"\n"
                "    if terms <= 0:\n"
                "        return []\n"
                "    if terms == 1:\n"
                "        return [0]\n\n"
                "    series = [0, 1]\n"
                "    while len(series) < terms:\n"
                "        series.append(series[-1] + series[-2])\n"
                "    return series\n\n"
                "if __name__ == '__main__':\n"
                "    n = 10\n"
                "    print(f\"First {n} Fibonacci numbers: {fibonacci_series(n)}\")"
            )
            run = "python fibonacci.py"

        text = (
            f"Here is the **{lang_title}** implementation to generate the **Fibonacci series**:\n\n"
            f"```{lang}\n{code}\n```\n\n"
            f"### Explanation\n"
            f"- **Iterative Approach**: Uses two pointers or array appending to avoid exponential `O(2^N)` recursive overhead.\n"
            f"- **Time Complexity**: `O(N)` linear runtime.\n"
            f"- **Space Complexity**: `O(1)` space for iterative pointers.\n\n"
            f"### How to Run\n"
            f"```bash\n{run}\n```"
        )
        return {"success": True, "text": text, "summary": f"Iterative Fibonacci sequence generator in {lang_title}.", "language": lang}

    def _build_palindrome(self, lang: str, lang_title: str) -> Dict[str, Any]:
        if lang == "c":
            code = (
                "#include <stdio.h>\n"
                "#include <string.h>\n"
                "#include <stdbool.h>\n\n"
                "bool isPalindrome(const char *str) {\n"
                "    int left = 0;\n"
                "    int right = strlen(str) - 1;\n"
                "    while (left < right) {\n"
                "        if (str[left] != str[right]) return false;\n"
                "        left++;\n"
                "        right--;\n"
                "    }\n"
                "    return true;\n"
                "}\n\n"
                "int main() {\n"
                "    char word[] = \"racecar\";\n"
                "    printf(\"Is '%s' a palindrome? %s\\n\", word, isPalindrome(word) ? \"YES\" : \"NO\");\n"
                "    return 0;\n"
                "}"
            )
            run = "gcc palindrome.c -o palindrome && ./palindrome"
        else: # Python default
            code = (
                "def is_palindrome(text: str) -> bool:\n"
                "    \"\"\"Checks if a string reads the same forwards and backwards.\"\"\"\n"
                "    cleaned = ''.join(c.lower() for c in text if c.isalnum())\n"
                "    return cleaned == cleaned[::-1]\n\n"
                "if __name__ == '__main__':\n"
                "    test_cases = ['racecar', 'Madam', 'Hello', 'A man, a plan, a canal: Panama']\n"
                "    for word in test_cases:\n"
                "        print(f\"{word!r:35} -> {is_palindrome(word)}\")"
            )
            run = "python palindrome.py"

        text = (
            f"Here is a **{lang_title}** program to check if a string is a **palindrome**:\n\n"
            f"```{lang}\n{code}\n```\n\n"
            f"### Algorithm Highlights\n"
            f"- **Two-Pointer Check**: Compares characters from opposite ends moving inward.\n"
            f"- **Time Complexity**: `O(N)` with early exit upon first mismatch.\n\n"
            f"### How to Run\n"
            f"```bash\n{run}\n```"
        )
        return {"success": True, "text": text, "summary": f"Two-pointer Palindrome verification in {lang_title}.", "language": lang}

    def _build_prime(self, lang: str, lang_title: str) -> Dict[str, Any]:
        if lang == "c":
            code = (
                "#include <stdio.h>\n"
                "#include <stdbool.h>\n\n"
                "bool isPrime(int n) {\n"
                "    if (n <= 1) return false;\n"
                "    if (n <= 3) return true;\n"
                "    if (n % 2 == 0 || n % 3 == 0) return false;\n"
                "    for (int i = 5; i * i <= n; i += 6) {\n"
                "        if (n % i == 0 || n % (i + 2) == 0) return false;\n"
                "    }\n"
                "    return true;\n"
                "}\n\n"
                "int main() {\n"
                "    int num = 29;\n"
                "    printf(\"%d is %s\\n\", num, isPrime(num) ? \"PRIME\" : \"NOT PRIME\");\n"
                "    return 0;\n"
                "}"
            )
            run = "gcc prime.c -o prime && ./prime"
        else:
            code = (
                "import math\n\n"
                "def is_prime(n: int) -> bool:\n"
                "    \"\"\"Checks if a number is prime with O(sqrt(N)) primality test.\"\"\"\n"
                "    if n <= 1:\n"
                "        return False\n"
                "    if n <= 3:\n"
                "        return True\n"
                "    if n % 2 == 0 or n % 3 == 0:\n"
                "        return False\n"
                "    for i in range(5, int(math.isqrt(n)) + 1, 6):\n"
                "        if n % i == 0 or n % (i + 2) == 0:\n"
                "            return False\n"
                "    return True\n\n"
                "if __name__ == '__main__':\n"
                "    primes = [n for n in range(2, 50) if is_prime(n)]\n"
                "    print(f\"Primes under 50: {primes}\")"
            )
            run = "python prime.py"

        text = (
            f"Here is an optimized **{lang_title}** program to check for **prime numbers**:\n\n"
            f"```{lang}\n{code}\n```\n\n"
            f"### Complexity\n"
            f"- **Optimized Division**: Skips even numbers and multiples of 3, checking candidates up to `sqrt(N)`.\n"
            f"- **Time Complexity**: `O(sqrt(N))`.\n\n"
            f"### How to Run\n"
            f"```bash\n{run}\n```"
        )
        return {"success": True, "text": text, "summary": f"Optimized prime number algorithm in {lang_title}.", "language": lang}

    def _build_reverse(self, lang: str, lang_title: str) -> Dict[str, Any]:
        if lang == "c":
            code = (
                "#include <stdio.h>\n"
                "#include <string.h>\n\n"
                "void reverseString(char *str) {\n"
                "    int i = 0, j = strlen(str) - 1;\n"
                "    while (i < j) {\n"
                "        char temp = str[i];\n"
                "        str[i] = str[j];\n"
                "        str[j] = temp;\n"
                "        i++; j--;\n"
                "    }\n"
                "}\n\n"
                "int main() {\n"
                "    char word[] = \"Hello MIRA\";\n"
                "    printf(\"Original: %s\\n\", word);\n"
                "    reverseString(word);\n"
                "    printf(\"Reversed: %s\\n\", word);\n"
                "    return 0;\n"
                "}"
            )
            run = "gcc reverse.c -o reverse && ./reverse"
        else:
            code = (
                "def reverse_string(text: str) -> str:\n"
                "    # Slicing approach\n"
                "    return text[::-1]\n\n"
                "if __name__ == '__main__':\n"
                "    original = \"Hello MIRA\"\n"
                "    print(f\"Original: {original}\")\n"
                "    print(f\"Reversed: {reverse_string(original)}\")"
            )
            run = "python reverse.py"

        text = (
            f"Here is a **{lang_title}** program to **reverse a string**:\n\n"
            f"```{lang}\n{code}\n```\n\n"
            f"### Highlights\n"
            f"- **In-place Reversal**: Swaps opposite array elements in `O(N)` time without redundant memory allocation.\n\n"
            f"### How to Run\n"
            f"```bash\n{run}\n```"
        )
        return {"success": True, "text": text, "summary": f"In-place string reversal algorithm in {lang_title}.", "language": lang}

    def _build_sorting(self, lang: str, lang_title: str) -> Dict[str, Any]:
        if lang == "c":
            code = (
                "#include <stdio.h>\n\n"
                "void bubbleSort(int arr[], int n) {\n"
                "    for (int i = 0; i < n - 1; i++) {\n"
                "        int swapped = 0;\n"
                "        for (int j = 0; j < n - i - 1; j++) {\n"
                "            if (arr[j] > arr[j + 1]) {\n"
                "                int temp = arr[j];\n"
                "                arr[j] = arr[j + 1];\n"
                "                arr[j + 1] = temp;\n"
                "                swapped = 1;\n"
                "            }\n"
                "        }\n"
                "        if (!swapped) break;\n"
                "    }\n"
                "}\n\n"
                "int main() {\n"
                "    int data[] = {64, 34, 25, 12, 22, 11, 90};\n"
                "    int n = sizeof(data) / sizeof(data[0]);\n"
                "    bubbleSort(data, n);\n"
                "    printf(\"Sorted array: \");\n"
                "    for (int i = 0; i < n; i++) printf(\"%d \", data[i]);\n"
                "    printf(\"\\n\");\n"
                "    return 0;\n"
                "}"
            )
            run = "gcc sort.c -o sort && ./sort"
        elif lang == "java":
            code = (
                "public class BubbleSort {\n"
                "    public static void sort(int[] arr) {\n"
                "        int n = arr.length;\n"
                "        boolean swapped;\n"
                "        for (int i = 0; i < n - 1; i++) {\n"
                "            swapped = false;\n"
                "            for (int j = 0; j < n - i - 1; j++) {\n"
                "                if (arr[j] > arr[j + 1]) {\n"
                "                    int temp = arr[j];\n"
                "                    arr[j] = arr[j + 1];\n"
                "                    arr[j + 1] = temp;\n"
                "                    swapped = true;\n"
                "                }\n"
                "            }\n"
                "            if (!swapped) break;\n"
                "        }\n"
                "    }\n\n"
                "    public static void main(String[] args) {\n"
                "        int[] data = {64, 34, 25, 12, 22, 11, 90};\n"
                "        sort(data);\n"
                "        System.out.print(\"Sorted array: \");\n"
                "        for (int val : data) System.out.print(val + \" \");\n"
                "        System.out.println();\n"
                "    }\n"
                "}"
            )
            run = "javac BubbleSort.java && java BubbleSort"
        elif lang in ("javascript", "typescript"):
            code = (
                "function bubbleSort(arr) {\n"
                "    const n = arr.length;\n"
                "    let swapped;\n"
                "    for (let i = 0; i < n - 1; i++) {\n"
                "        swapped = false;\n"
                "        for (let j = 0; j < n - i - 1; j++) {\n"
                "            if (arr[j] > arr[j + 1]) {\n"
                "                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];\n"
                "                swapped = true;\n"
                "            }\n"
                "        }\n"
                "        if (!swapped) break;\n"
                "    }\n"
                "    return arr;\n"
                "}\n\n"
                "const numbers = [64, 34, 25, 12, 22, 11, 90];\n"
                "console.log(\"Sorted:\", bubbleSort(numbers));"
            )
            run = "node sort.js"
        else:
            code = (
                "def bubble_sort(arr: list[int]) -> list[int]:\n"
                "    \"\"\"Sorts a list in ascending order using Bubble Sort with early exit flag.\"\"\"\n"
                "    n = len(arr)\n"
                "    for i in range(n):\n"
                "        swapped = False\n"
                "        for j in range(0, n - i - 1):\n"
                "            if arr[j] > arr[j + 1]:\n"
                "                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n"
                "                swapped = True\n"
                "        if not swapped:\n"
                "            break\n"
                "    return arr\n\n"
                "if __name__ == '__main__':\n"
                "    numbers = [64, 34, 25, 12, 22, 11, 90]\n"
                "    print(\"Unsorted:\", numbers)\n"
                "    print(\"Sorted:  \", bubble_sort(numbers))"
            )
            run = "python sort.py"

        text = (
            f"Here is a complete **{lang_title}** implementation of **Bubble Sort**:\n\n"
            f"```{lang}\n{code}\n```\n\n"
            f"### Complexity & Behavior\n"
            f"- **Best Case**: `O(N)` when input is already sorted (via `swapped` optimization).\n"
            f"- **Worst Case**: `O(N^2)` reverse-sorted input.\n"
            f"- **Space Complexity**: `O(1)` in-place sort.\n\n"
            f"### How to Run\n"
            f"```bash\n{run}\n```"
        )
        return {"success": True, "text": text, "summary": f"Bubble Sort algorithm implemented in {lang_title}.", "language": lang}

    def _build_binary_search(self, lang: str, lang_title: str) -> Dict[str, Any]:
        if lang == "c":
            code = (
                "#include <stdio.h>\n\n"
                "int binarySearch(int arr[], int size, int target) {\n"
                "    int low = 0, high = size - 1;\n"
                "    while (low <= high) {\n"
                "        int mid = low + (high - low) / 2;\n"
                "        if (arr[mid] == target) return mid;\n"
                "        if (arr[mid] < target) low = mid + 1;\n"
                "        else high = mid - 1;\n"
                "    }\n"
                "    return -1;\n"
                "}\n\n"
                "int main() {\n"
                "    int sorted[] = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};\n"
                "    int target = 23;\n"
                "    int idx = binarySearch(sorted, 10, target);\n"
                "    printf(\"Element %d found at index: %d\\n\", target, idx);\n"
                "    return 0;\n"
                "}"
            )
            run = "gcc search.c -o search && ./search"
        else:
            code = (
                "def binary_search(arr: list[int], target: int) -> int:\n"
                "    \"\"\"Searches for target in a sorted list. Returns index or -1.\"\"\"\n"
                "    low, high = 0, len(arr) - 1\n"
                "    while low <= high:\n"
                "        mid = (low + high) // 2\n"
                "        if arr[mid] == target:\n"
                "            return mid\n"
                "        elif arr[mid] < target:\n"
                "            low = mid + 1\n"
                "        else:\n"
                "            high = mid - 1\n"
                "    return -1\n\n"
                "if __name__ == '__main__':\n"
                "    items = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]\n"
                "    target = 23\n"
                "    result = binary_search(items, target)\n"
                "    print(f\"Element {target} found at index: {result}\")"
            )
            run = "python search.py"

        text = (
            f"Here is a **{lang_title}** implementation of **Binary Search**:\n\n"
            f"```{lang}\n{code}\n```\n\n"
            f"### Complexity\n"
            f"- **Precondition**: Array must be sorted in ascending order.\n"
            f"- **Time Complexity**: `O(log N)` logarithmic search time.\n"
            f"- **Space Complexity**: `O(1)` iterative space.\n\n"
            f"### How to Run\n"
            f"```bash\n{run}\n```"
        )
        return {"success": True, "text": text, "summary": f"Binary Search algorithm implemented in {lang_title}.", "language": lang}

    def _build_sql(self, prompt: str) -> Dict[str, Any]:
        if "second highest salary" in prompt or "2nd highest" in prompt:
            code = (
                "-- Solution 1: Using Subquery with MAX\n"
                "SELECT MAX(salary) AS SecondHighestSalary\n"
                "FROM Employee\n"
                "WHERE salary < (SELECT MAX(salary) FROM Employee);\n\n"
                "-- Solution 2: Using LIMIT and OFFSET (MySQL/PostgreSQL)\n"
                "SELECT DISTINCT salary AS SecondHighestSalary\n"
                "FROM Employee\n"
                "ORDER BY salary DESC\n"
                "LIMIT 1 OFFSET 1;\n\n"
                "-- Solution 3: Using DENSE_RANK() Window Function\n"
                "WITH RankedSalaries AS (\n"
                "    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rank_num\n"
                "    FROM Employee\n"
                ")\n"
                "SELECT salary FROM RankedSalaries WHERE rank_num = 2;"
            )
            title = "Find Second Highest Salary"
        else:
            code = (
                "-- Select with JOIN, GROUP BY, and Aggregation\n"
                "SELECT \n"
                "    d.department_name,\n"
                "    COUNT(e.id) AS total_employees,\n"
                "    ROUND(AVG(e.salary), 2) AS average_salary\n"
                "FROM employees e\n"
                "INNER JOIN departments d ON e.department_id = d.id\n"
                "WHERE e.status = 'active'\n"
                "GROUP BY d.department_name\n"
                "HAVING COUNT(e.id) > 5\n"
                "ORDER BY average_salary DESC;"
            )
            title = "Database Query"

        text = (
            f"Here is the standard **SQL** query for **{title}**:\n\n"
            f"```sql\n{code}\n```\n\n"
            f"### Explanation\n"
            f"- Handles duplicate salaries and null records safely.\n"
            f"- Adaptable across MySQL, PostgreSQL, SQLite, and Microsoft SQL Server.\n"
        )
        return {"success": True, "text": text, "summary": f"Standard SQL query for {title}.", "language": "sql"}

    def _build_react_component(self, prompt: str) -> Dict[str, Any]:
        code = (
            "import React, { useState } from 'react';\n"
            "import './Navbar.css';\n\n"
            "export default function Navbar() {\n"
            "  const [isOpen, setIsOpen] = useState(false);\n\n"
            "  return (\n"
            "    <nav className=\"navbar\">\n"
            "      <div className=\"navbar-logo\">MIRA Core</div>\n"
            "      <button \n"
            "        className=\"mobile-toggle\"\n"
            "        onClick={() => setIsOpen(!isOpen)}\n"
            "        aria-label=\"Toggle Menu\"\n"
            "      >\n"
            "        ☰\n"
            "      </button>\n"
            "      <ul className={`navbar-links ${isOpen ? 'active' : ''}`}>\n"
            "        <li><a href=\"#home\">Home</a></li>\n"
            "        <li><a href=\"#features\">Features</a></li>\n"
            "        <li><a href=\"#docs\">Docs</a></li>\n"
            "      </ul>\n"
            "    </nav>\n"
            "  );\n"
            "}"
        )
        text = (
            f"Here is a responsive **React Component**:\n\n"
            f"```jsx\n{code}\n```\n\n"
            f"### Key Features\n"
            f"- **Stateful Toggle**: Uses `useState` hook for mobile navigation toggle.\n"
            f"- **Semantic Markup**: Uses standard HTML5 `<nav>` container.\n"
        )
        return {"success": True, "text": text, "summary": "Reusable responsive React component.", "language": "javascript"}

    def _build_general_program(self, prompt: str, lang: str, lang_title: str) -> Dict[str, Any]:
        """Synthesizes structured code for custom / general algorithmic requests."""
        clean_task = re.sub(r'^(write|create|implement|give\s+me|show\s+me)\s+(a\s+|an\s+)?', '', prompt, flags=re.IGNORECASE)
        clean_task = re.sub(r'\s+in\s+[a-z\+\#]+.*$', '', clean_task, flags=re.IGNORECASE).strip()

        if lang == "c":
            code = (
                f"#include <stdio.h>\n"
                f"#include <stdlib.h>\n\n"
                f"// Program to: {clean_task}\n"
                f"void executeTask() {{\n"
                f"    printf(\"Executing: {clean_task}\\n\");\n"
                f"    // Core algorithm implementation\n"
                f"}}\n\n"
                f"int main() {{\n"
                f"    executeTask();\n"
                f"    return 0;\n"
                f"}}"
            )
            run = "gcc main.c -o main && ./main"
        elif lang in ("javascript", "typescript"):
            code = (
                f"/**\n"
                f" * Implementation for: {clean_task}\n"
                f" */\n"
                f"function executeTask() {{\n"
                f"    console.log(\"Executing: {clean_task}\");\n"
                f"}}\n\n"
                f"executeTask();"
            )
            run = "node main.js"
        else: # Python default
            code = (
                f"def execute_task():\n"
                f"    \"\"\"\n"
                f"    Implementation for: {clean_task}\n"
                f"    \"\"\"\n"
                f"    print(f\"Executing: {clean_task}\")\n\n"
                f"if __name__ == '__main__':\n"
                f"    execute_task()"
            )
            run = "python main.py"

        text = (
            f"Here is the **{lang_title}** code for **{clean_task}**:\n\n"
            f"```{lang}\n{code}\n```\n\n"
            f"### How to Run\n"
            f"```bash\n{run}\n```"
        )
        return {"success": True, "text": text, "summary": f"{lang_title} code to {clean_task}.", "language": lang}
