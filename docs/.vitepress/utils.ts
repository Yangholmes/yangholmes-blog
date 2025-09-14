/**
 * @file
 * @author Yangholmes 2025-08-05
 */

import { join, resolve } from 'path';
import { readdirSync, readFileSync, statSync } from 'fs';
import matter from 'gray-matter';

export type PostItem = {
  title: string;
  category: string;
  url: string;
  createDate?: string | number;
  excerpt?: string;
}

const CategoriesBlacklist = ['tag'];

export function getAllCategories() {
  const postRoot = resolve(import.meta.dirname, '../posts');
  const folders = readdirSync(postRoot);
  // 获取所有分类
  const categories = folders.filter(f => {
    return !f.startsWith('.') &&
      !CategoriesBlacklist.includes(f) &&
      statSync(join(postRoot, f)).isDirectory();
  });
  return categories;
}

export function getAllPostsByCat() {
  const postRoot = resolve(import.meta.dirname, '../posts');
  const categories = getAllCategories();

  const allPosts: {
    [key: string]: PostItem[]
  } = {};

  categories.forEach(cat => {
    const catDir = join(postRoot, cat);
    const posts = readdirSync(catDir)
      .filter(f => {
        if (statSync(join(catDir, f)).isDirectory()) {
          return true;
        }
        return f.endsWith('.md') && f !== 'index.md';
      }).map(post => {
        let path = '';
        if (statSync(join(catDir, post)).isDirectory()) {
          path = join(catDir, post, 'index.md');
        } else {
          path = join(catDir, post);
        }
        const frontmatter = matter.read(path, {
          // excerpt: true,
        });
        return {
          title: post.replace('.md', ''),
          category: cat,
          url: `/${cat}/${post.replace('.md', '')}`,
          createDate: frontmatter.data.createDate,
          excerpt: frontmatter.excerpt,
          // frontmatter
        };
      }).sort((a, b) => {
        const at = a.createDate ? new Date(a.createDate).getTime() : 0;
        const bt = b.createDate ? new Date(b.createDate).getTime() : 0;
        return bt - at;
      });

    allPosts[cat] = posts;
  });

  return allPosts;
}

export function importFile(filePath: string) {
  const path = resolve(import.meta.dirname, filePath);
  return readFileSync(path, 'utf-8');
}
