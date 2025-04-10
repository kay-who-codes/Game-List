#!/bin/bash
# ------------------------------------------------------------------------------
# This script creates/updates a GitHub repository based on the name of the current folder.
# It reads your GitHub Access Token from "Github Access Token - Repo.txt", checks if a repository
# with the current folder name (spaces replaced with dashes) exists, and creates it if not.
# It then initialises (or uses an existing) git repository and force-pushes all content to GitHub.
#
# Requirements:
# - cURL, Git must be installed.
# - The script must be run from inside the folder you wish to use.
#
# Author: Your Name
# ------------------------------------------------------------------------------

# Determine the current folder name and replace spaces with dashes
folder_name=$(basename "$PWD")
repo_name=$(echo "$folder_name" | tr ' ' '-')

# Read the GitHub access token from file (removing any newlines)
TOKEN=$(cat "A:/Programming/Access Tokens/Github Access Token - Repo n Workflow.txt" | tr -d '\n')

# GitHub username and API endpoints
USER="kay-who-codes"
REPO_API_URL="https://api.github.com/repos/$USER/$repo_name"

echo "Repository name derived from folder: $repo_name"

# Check if the repository already exists on GitHub
http_code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token $TOKEN" "$REPO_API_URL")

if [ "$http_code" -eq 200 ]; then
    echo "Repository '$repo_name' already exists on GitHub."
else
    echo "Creating repository '$repo_name' on GitHub..."
    curl -s -X POST -H "Authorization: token $TOKEN" \
         -H "Content-Type: application/json" \
         -d "{\"name\": \"$repo_name\", \"private\": false}" \
         "https://api.github.com/user/repos" > /dev/null
    echo "Repository created."

    # Enable GitHub Pages for the repository
    echo "Enabling GitHub Pages on branch 'main'..."
    curl -s -X POST -H "Authorization: token $TOKEN" \
         -H "Accept: application/vnd.github+json" \
         -H "Content-Type: application/json" \
         -d "{\"source\": {\"branch\": \"main\", \"path\": \"/\"}}" \
         "https://api.github.com/repos/$USER/$repo_name/pages" > /dev/null
    echo "GitHub Pages enabled."
fi

# Initialise a new git repository if not already present
if [ ! -d ".git" ]; then
    echo "Initialising a new git repository..."
    git init
    git checkout -b main
fi

# Set (or update) the remote origin to include the access token
desired_url="https://$TOKEN@github.com/$USER/$repo_name.git"
current_remote=$(git remote get-url origin 2>/dev/null)

if [ "$current_remote" != "$desired_url" ]; then
    echo "Setting remote origin to the GitHub repository URL..."
    git remote remove origin 2>/dev/null
    git remote add origin "$desired_url"
fi

# Add all files, commit (allowing an empty commit if no changes) and force-push to the 'main' branch
echo "Adding all files and committing..."
git add .
git commit -m "Update repository with local files" --allow-empty
echo "Pushing files to GitHub..."
git push -u origin main --force

echo "All files have been successfully pushed to the GitHub repository: $repo_name."
