#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 版本号从 manifest.json 中获取
VERSION=$(cat manifest.json | grep '"version"' | cut -d'"' -f4)
PACKAGE_NAME="tai-chat-v$VERSION"

echo -e "${GREEN}开始打包 Tai Chat 扩展 v$VERSION${NC}"

# 创建临时目录
echo -e "${YELLOW}创建临时目录...${NC}"
rm -rf dist
mkdir -p dist/$PACKAGE_NAME

# 复制必要文件
echo -e "${YELLOW}复制文件...${NC}"
cp -r \
    manifest.json \
    *.html \
    *.js \
    *.css \
    icons \
    lib \
    js \
    docs \
    LICENSE \
    README.md \
    dist/$PACKAGE_NAME/

# 进入 dist 目录
cd dist

# 创建 zip 包
echo -e "${YELLOW}创建 zip 包...${NC}"
zip -r "$PACKAGE_NAME.zip" "$PACKAGE_NAME"

# 清理临时文件
echo -e "${YELLOW}清理临时文件...${NC}"
rm -rf $PACKAGE_NAME

echo -e "${GREEN}打包完成！${NC}"
echo -e "打包文件位置: ${YELLOW}dist/$PACKAGE_NAME.zip${NC}" 