import { readFileSync } from 'fs';
import { resolve } from 'path';
import matter from 'gray-matter';
import { globSync } from 'glob';
import { PostItem } from '../../.vitepress/utils';

export type TagPostList = {
  params: {
    tag: string;
    posts: PostItem[];
  }
}[]

export default {
  async paths() {
    const root = resolve(import.meta.dirname, '../')

    const tagsMap = new Map<string, PostItem[]>();

    const files = globSync(`${root}/**/*.md`);

    files.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      const { data: frontmatter } = matter(content);

      const tags: string[] = [];

      if (Array.isArray(frontmatter.tags)) {
        tags.push(...frontmatter.tags.map(tag => tag.trim()));
      } else if (typeof frontmatter.tags === 'string') {
        tags.push(...frontmatter.tags
          .split(',')
          .map(tag => tag.trim())
        );
      }

      const relativePath = file.slice(root.length + 1);
      const subjects = relativePath.split('/');
      let category = '';
      let title = '';
      if (subjects.length === 2) {
        category = subjects[0];
        title = subjects[0];
      } else if (subjects.length === 3) {
        category = subjects[0];
        title = subjects[1];
      } else {
        title = subjects[0].replace('.md', '');
      }

      tags.forEach(tag => {
        if (!tagsMap.has(tag)) {
          tagsMap.set(tag, []);
        }
        tagsMap.get(tag)?.push({
          category,
          createDate: frontmatter.createDate,
          title,
          url: relativePath.replace('.md', '')
        });
      })
    });

    const tagList: TagPostList = Array.from(tagsMap, ([key, value]) => {
      return {
        params: {
          tag: key,
          posts: value.sort((a, b) => {
            const at = a.createDate ? new Date(a.createDate).getTime() : 0;
            const bt = b.createDate ? new Date(b.createDate).getTime() : 0;
            return bt - at;
          })
        },
        content: key
      }
    })

    return tagList
  }
}