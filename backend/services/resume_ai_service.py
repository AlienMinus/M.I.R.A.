import re
import time
import requests
from typing import Dict, Any, List, Optional
from pathlib import Path
import sys

# Ensure backend path is configured
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import config

class ResumeAIService:
    def __init__(self, hf_token: Optional[str] = None, pipeline_service = None):
        self.hf_token = hf_token or config.HF_TOKEN
        self.pipeline_service = pipeline_service
        if self.hf_token:
            masked = f"{self.hf_token[:6]}...{self.hf_token[-4:]}"
            print(f"[ResumeAIService] Initialized with Hugging Face Token: {masked}")
        else:
            print("[ResumeAIService] Initialized without HF_TOKEN (fallback engine active).")

    def compile_resume_context(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extracts and structures the full resume data across all sections
        into a rich semantic context for AI summary synthesis.
        """
        header = profile.get("header") or {}
        name = header.get("name", "").strip() or "The Candidate"
        location = header.get("location", "").strip()

        # 1. Skills compilation
        skills_raw = profile.get("skills") or []
        skills_by_category = {}
        all_skills = []
        for s in skills_raw:
            if isinstance(s, dict):
                cat = s.get("category", "General").strip()
                items_str = s.get("items", "").strip()
                if items_str:
                    items_list = [i.strip() for i in re.split(r'[,|;•]', items_str) if i.strip()]
                    skills_by_category[cat] = items_list
                    all_skills.extend(items_list)

        # 2. Experience compilation
        experience_raw = profile.get("experience") or []
        experience_items = []
        for exp in experience_raw:
            if isinstance(exp, dict):
                role = exp.get("role", "").strip()
                period = exp.get("period", "").strip()
                details = exp.get("details", [])
                details_text = " ".join([d.strip() for d in details if isinstance(d, str) and d.strip()])
                experience_items.append({
                    "role": role,
                    "period": period,
                    "details": details_text
                })

        # 3. Projects compilation
        projects_raw = profile.get("projects") or []
        projects_items = []
        for prj in projects_raw:
            if isinstance(prj, dict):
                title = prj.get("title", "").strip()
                tech = prj.get("tech", "").strip()
                details = prj.get("details", [])
                details_text = " ".join([d.strip() for d in details if isinstance(d, str) and d.strip()])
                projects_items.append({
                    "title": title,
                    "tech": tech,
                    "details": details_text
                })

        # 4. Education compilation
        education_raw = profile.get("education") or []
        education_items = []
        for edu in education_raw:
            if isinstance(edu, dict):
                inst = edu.get("institution", "").strip()
                degree = edu.get("degree", "").strip()
                score = edu.get("score", "").strip()
                education_items.append({
                    "institution": inst,
                    "degree": degree,
                    "score": score
                })

        # 5. Certifications & Achievements
        certs_raw = profile.get("certifications") or []
        certs_items = [c.get("title", "").strip() for c in certs_raw if isinstance(c, dict) and c.get("title")]

        achieve_raw = profile.get("achievements") or []
        achieve_items = [a.get("title", "").strip() for a in achieve_raw if isinstance(a, dict) and a.get("title")]

        existing_summary = profile.get("summary", "").strip()

        # Infer Primary Professional Domain
        all_text = " ".join([
            name,
            " ".join(all_skills),
            " ".join([e["role"] + " " + e["details"] for e in experience_items]),
            " ".join([p["title"] + " " + p["tech"] + " " + p["details"] for p in projects_items]),
            " ".join([ed["degree"] for ed in education_items]),
            existing_summary
        ]).lower()

        domains = []
        if any(k in all_text for k in ["full-stack", "react", "node", "frontend", "backend", "web"]):
            domains.append("Full-Stack Development")
        if any(k in all_text for k in ["ai", "ml", "machine learning", "deep learning", "yolo", "opencv", "computer vision", "nlp", "tensorflow", "pytorch"]):
            domains.append("AI & Machine Learning")
        if any(k in all_text for k in ["cybersecurity", "ethical hacking", "security", "firewall", "vpn", "vulnerability"]):
            domains.append("Cybersecurity & Network Defense")
        if any(k in all_text for k in ["iot", "robotics", "embedded", "edge computing", "cisco"]):
            domains.append("IoT & Embedded Systems")
        if any(k in all_text for k in ["cloud", "docker", "devops", "aws", "kubernetes"]):
            domains.append("Cloud & DevOps Architecture")

        primary_degree = education_items[0]["degree"] if education_items else ""
        if "electrical & computer engineering" in primary_degree.lower():
            degree_title = "Electrical & Computer Engineering Professional"
        elif "computer science" in primary_degree.lower():
            degree_title = "Computer Science Engineer"
        elif domains:
            degree_title = f"{domains[0]} Engineer"
        else:
            degree_title = "Software Engineer & Technology Specialist"

        return {
            "name": name,
            "location": location,
            "degree_title": degree_title,
            "domains": domains or ["Software Engineering", "Full-Stack Development"],
            "all_skills": all_skills,
            "skills_by_category": skills_by_category,
            "experience": experience_items,
            "projects": projects_items,
            "education": education_items,
            "certifications": certs_items,
            "achievements": achieve_items,
            "existing_summary": existing_summary
        }

    def call_huggingface_router(self, context: Dict[str, Any]) -> Optional[str]:
        """
        Attempts to call Hugging Face Inference Router with HF_TOKEN using the compiled resume context.
        """
        if not self.hf_token:
            return None

        # Build comprehensive ATS prompt from context
        skills_str = ", ".join(context["all_skills"][:20])
        exp_summaries = "; ".join([
            f"{e['role']}: {e['details'][:100]}" for e in context["experience"][:3]
        ])
        proj_summaries = "; ".join([
            f"{p['title']} ({p['tech']}): {p['details'][:80]}" for p in context["projects"][:3]
        ])
        edu_summary = "; ".join([f"{ed['degree']} at {ed['institution']}" for ed in context["education"][:2]])

        system_prompt = (
            "You are an executive ATS resume strategist and professional copywriter. "
            "Write a high-impact, ATS-optimized Executive Summary (exactly 3 to 4 sentences in ONE cohesive paragraph, ~60-80 words). "
            "Highlight core specialization, technical stack, hands-on project accomplishments, and business impact. "
            "Use HTML <strong>...</strong> tags selectively around key technical domains and keywords. "
            "Do NOT include headings, quotes, conversational preambles, or markdown asterisks."
        )

        user_content = (
            f"Candidate Name: {context['name']}\n"
            f"Target Domain: {', '.join(context['domains'])}\n"
            f"Education: {edu_summary}\n"
            f"Core Technical Skills: {skills_str}\n"
            f"Work Experience Highlights: {exp_summaries}\n"
            f"Key Projects: {proj_summaries}\n\n"
            f"Generate the polished, ATS-optimized executive summary paragraph now:"
        )

        # Candidates of models to attempt
        models_to_try = [
            "meta-llama/Llama-3.1-8B-Instruct",
            "Qwen/Qwen2.5-7B-Instruct",
            "mistralai/Mistral-7B-Instruct-v0.3"
        ]

        headers = {
            "Authorization": f"Bearer {self.hf_token}",
            "Content-Type": "application/json"
        }

        for model_id in models_to_try:
            try:
                payload = {
                    "model": model_id,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    "max_tokens": 180,
                    "temperature": 0.65
                }
                print(f"[ResumeAIService] Attempting Hugging Face Router model '{model_id}'...")
                resp = requests.post(
                    "https://router.huggingface.co/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=14
                )
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        raw_text = choices[0]["message"].get("content", "").strip()
                        cleaned = self._clean_generated_summary(raw_text)
                        if len(cleaned.split()) >= 20:
                            print(f"[ResumeAIService] Successfully generated summary via Hugging Face ({model_id})!")
                            return cleaned
                else:
                    print(f"[ResumeAIService] HF Router returned {resp.status_code}: {resp.text[:100]}")
            except Exception as e:
                print(f"[ResumeAIService] HF Router call failed for {model_id}: {e}")

        return None

    def synthesize_ats_summary(self, context: Dict[str, Any]) -> str:
        """
        Intelligent ATS contextual synthesis engine that analyzes the complete resume
        and generates a formatted executive summary paragraph.
        """
        name = context["name"]
        degree_title = context["degree_title"]
        domains = context["domains"]
        skills = context["all_skills"]
        experience = context["experience"]
        projects = context["projects"]
        education = context["education"]

        # 1. Primary Specialization Keywords for <strong> bolding
        core_pillars = []
        if domains:
            core_pillars.extend(domains[:3])
        if len(core_pillars) < 3 and skills:
            core_pillars.extend(skills[:3])
        pillars_str = "<strong>" + ", ".join(core_pillars[:4]) + "</strong>"

        # 2. Experience / Project Accomplishments
        top_tech = []
        for s in skills[:6]:
            if s not in top_tech and len(top_tech) < 5:
                top_tech.append(s)
        tech_str = ", ".join(top_tech) if top_tech else "modern architectures"

        # Look for quantifiable metrics or key role details
        exp_metrics = []
        for exp in experience:
            txt = exp.get("details", "")
            metrics = re.findall(r'\b(?:\d+\+?|\d+%\s*|\d+\s*(?:applications|systems|projects|domains))\b', txt, flags=re.IGNORECASE)
            if metrics:
                exp_metrics.extend(metrics)

        metric_phrase = f"delivering {exp_metrics[0]} specialized milestones" if exp_metrics else "delivering scalable end-to-end solutions"

        # 3. Projects highlights
        project_names = [p["title"] for p in projects[:2] if p.get("title")]
        proj_context = f", including {', '.join(project_names)}" if project_names else ""

        # Construct sentences
        sentence_1 = f"Results-driven {degree_title} and technology innovator with proven expertise spanning {pillars_str}."

        sentence_2 = f"Proficient in designing intelligent software-hardware systems, implementing robust applications using <strong>{tech_str}</strong>, and translating complex engineering specifications into production-ready prototypes{proj_context}."

        sentence_3 = f"Demonstrated track record of {metric_phrase}, maintaining high standards of system security, architectural scalability, and cross-functional engineering excellence."

        sentence_4 = "Combines disciplined analytical problem-solving with rapid technical experimentation to accelerate mission-critical organizational objectives."

        paragraph = f"{sentence_1} {sentence_2} {sentence_3} {sentence_4}"
        return self._clean_generated_summary(paragraph)

    def _clean_generated_summary(self, text: str) -> str:
        """Clean generated summary from markdown backticks, extraneous quotes, and labels."""
        # Strip code fences
        clean = re.sub(r'```(?:html|markdown)?', '', text).strip()
        # Strip leading phrases like "Here is the summary:", "Executive Summary:", etc.
        clean = re.sub(r'^(?:executive\s+summary|summary|here\s+is\s+(?:the|your)\s+summary):?\s*', '', clean, flags=re.IGNORECASE).strip()
        # Strip outer quotes
        clean = clean.strip('"\'`')
        # Ensure balanced <strong> tags
        open_tags = clean.count("<strong>")
        close_tags = clean.count("</strong>")
        if open_tags > close_tags:
            clean += "</strong>" * (open_tags - close_tags)
        # Collapse whitespace
        clean = re.sub(r'\s+', ' ', clean).strip()
        return clean

    def polish_summary(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point: Ingests the whole resume data into context,
        attempts Hugging Face Token AI, and falls back to backend ATS engine.
        """
        start_time = time.time()
        context = self.compile_resume_context(profile)

        engine_used = "mira_ai_ats"
        model_name = "MIRA Contextual ATS Synthesizer"

        # 1. Try Hugging Face Router with HF_TOKEN
        hf_summary = self.call_huggingface_router(context)
        if hf_summary:
            summary = hf_summary
            engine_used = "huggingface_hub"
            model_name = "Hugging Face (Llama-3.1 / Qwen2.5)"
        else:
            # 2. Seamless local ATS contextual synthesis using the complete resume data
            print("[ResumeAIService] Generating formatted summary using backend ATS contextual AI engine...")
            summary = self.synthesize_ats_summary(context)

        elapsed = round(time.time() - start_time, 2)

        return {
            "success": True,
            "summary": summary,
            "engine": engine_used,
            "model": model_name,
            "execution_time_seconds": elapsed,
            "word_count": len(summary.split()),
            "context_analyzed": {
                "name": context["name"],
                "degree_title": context["degree_title"],
                "domains": context["domains"],
                "skills_count": len(context["all_skills"]),
                "experience_count": len(context["experience"]),
                "projects_count": len(context["projects"]),
                "education_count": len(context["education"])
            }
        }

