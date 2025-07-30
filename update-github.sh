#!/bin/bash

# GitHub Update Script for Email Metrics Project
# This script helps you regularly update your GitHub repository

echo "🚀 Starting GitHub update process..."

# Check for any changes
echo "📋 Checking for changes..."
git status

# Ask if user wants to continue
echo ""
read -p "Do you want to add and commit all changes? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Add all changes
    echo "📦 Adding all changes..."
    git add .
    
    # Ask for commit message
    echo ""
    read -p "Enter commit message (or press Enter for default): " commit_msg
    
    # Use default message if none provided
    if [ -z "$commit_msg" ]; then
        commit_msg="Regular update: $(date '+%Y-%m-%d %H:%M')"
    fi
    
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "$commit_msg"
    
    # Push to GitHub
    echo "⬆️ Pushing to GitHub..."
    git push origin main
    
    echo "✅ Successfully updated GitHub repository!"
    echo "🔗 View your repository at: https://github.com/pkom79/email-metrics.git"
else
    echo "❌ Update cancelled."
fi

echo ""
echo "📊 Current repository status:"
git status --short
