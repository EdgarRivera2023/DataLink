import os

# Configuration: What files matter to the AI?
INCLUDE_EXTENSIONS = {'.js', '.jsx', '.ts', '.tsx', '.json', '.local', '.example'}
EXCLUDE_DIRS = {'node_modules', '.next', '.git', 'public'}
OUTPUT_FILE = "project_skeleton.md"

def harvest():
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("# DataLink Web: Project Skeleton\n")
        f.write("Generated for NotebookLM analysis.\n\n")

        for root, dirs, files in os.walk("."):
            # Skip noise directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

            for file in files:
                if any(file.endswith(ext) for ext in INCLUDE_EXTENSIONS):
                    file_path = os.path.join(root, file)
                    f.write(f"## File: {file_path}\n")
                    f.write("```javascript\n")
                    try:
                        with open(file_path, "r", encoding="utf-8") as code_file:
                            f.write(code_file.read())
                    except Exception as e:
                        f.write(f"// Error reading file: {e}")
                    f.write("\n```\n\n")

    print(f"✅ Skeleton harvested into {OUTPUT_FILE}")

if __name__ == "__main__":
    harvest()
