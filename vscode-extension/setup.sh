#!/bin/bash
set -e

echo "=========================================="
echo "AI-BOM VS Code Extension Setup"
echo "=========================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js version is too old ($NODE_VERSION)"
    echo "Please upgrade to Node.js 18 or higher"
    exit 1
fi

echo "✓ Node.js $(node -v) found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    exit 1
fi

echo "✓ npm $(npm -v) found"
echo ""

# Install dependencies
echo "Installing npm dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "Error: npm install failed"
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

# Compile TypeScript
echo "Compiling TypeScript..."
npm run compile

if [ $? -ne 0 ]; then
    echo "Error: TypeScript compilation failed"
    exit 1
fi

echo "✓ TypeScript compiled successfully"
echo ""

# Check Python and ai-bom
echo "Checking Python and ai-bom installation..."

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
    echo "✓ Python $PYTHON_VERSION found"

    # Check ai-bom
    if python3 -m pip show ai-bom &> /dev/null; then
        AI_BOM_VERSION=$(python3 -m pip show ai-bom | grep Version | cut -d' ' -f2)
        echo "✓ ai-bom $AI_BOM_VERSION found"
    else
        echo "⚠ ai-bom is not installed"
        echo ""
        read -p "Install ai-bom now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Installing ai-bom..."
            python3 -m pip install ai-bom
            if [ $? -eq 0 ]; then
                echo "✓ ai-bom installed successfully"
            else
                echo "⚠ ai-bom installation failed (you can install it later)"
            fi
        else
            echo "Skipping ai-bom installation (you can install it later)"
        fi
    fi
else
    echo "⚠ Python 3 is not installed"
    echo "The extension requires Python 3.10+ with ai-bom"
    echo "Install from https://www.python.org/"
fi

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Open this folder in VS Code:"
echo "   code ."
echo ""
echo "2. Press F5 to launch the Extension Development Host"
echo ""
echo "3. In the new window, run:"
echo "   Command Palette > AI-BOM: Scan Workspace"
echo ""
echo "Or install the extension:"
echo "   npm run package"
echo "   code --install-extension ai-bom-scanner-0.1.0.vsix"
echo ""
echo "See GETTING_STARTED.md for more information"
echo ""
