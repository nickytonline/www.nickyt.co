---
title: Home
sections:
  - section_id: hero
    component: HeroBlock
    type: heroblock
    content: >-
      This section can contain a subtitle or tagline. The recommended length is
      one to three sentences, but can be changed as you prefer.
  - section_id: about
    component: ContentBlock
    type: contentblock
    title: About
    content: >-
      This is the "about" excerpt. It can be used to provide a paragraph about
      yourself that people can read on the homepage to get a sense of who you
      are. There also exists a dedicated about page where you can write more
      about yourself for those who are interested.
    actions:
      - label: Contact Me
        url: /contact
  - section_id: recent-posts
    component: PostsBlock
    type: postsblock
    title: Recent Posts
    num_posts_displayed: 4
    actions:
      - label: View Blog
        url: blog/index.html
menus:
  main:
    weight: 1
    title: Home
template: home
---
