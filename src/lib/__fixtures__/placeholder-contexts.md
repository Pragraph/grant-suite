# Placeholder regression fixture

Five tag types in eight markdown contexts. Code-block tags
(inline and fenced) must NOT be detected as resolver entries.

## Plain paragraph
Plain [VERIFY] tag in a paragraph.
Plain [CITATION NEEDED] tag in a paragraph.
Plain [USER INPUT NEEDED] tag in a paragraph.
Plain [ESTIMATED] tag in a paragraph.
Plain [CHECK DATE] tag in a paragraph.

## Bold
Bold **[VERIFY]** tag.
Bold **[CITATION NEEDED]** tag.
Bold **[USER INPUT NEEDED]** tag.
Bold **[ESTIMATED]** tag.
Bold **[CHECK DATE]** tag.

## Italic
Italic _[VERIFY]_ tag.
Italic _[CITATION NEEDED]_ tag.
Italic _[USER INPUT NEEDED]_ tag.
Italic _[ESTIMATED]_ tag.
Italic _[CHECK DATE]_ tag.

## Bold-italic
Bold-italic ***[VERIFY]*** tag.
Bold-italic ***[CITATION NEEDED]*** tag.
Bold-italic ***[USER INPUT NEEDED]*** tag.
Bold-italic ***[ESTIMATED]*** tag.
Bold-italic ***[CHECK DATE]*** tag.

## Heading [VERIFY]

### Sub-heading [CITATION NEEDED]

#### Sub-sub-heading [USER INPUT NEEDED]

##### Tiny heading [ESTIMATED]

###### Tiniest heading [CHECK DATE]

## List items
- Bullet [VERIFY] in a list.
- Bullet [CITATION NEEDED] in a list.
- Bullet [USER INPUT NEEDED] in a list.
1. Numbered [ESTIMATED] in a list.
1. Numbered [CHECK DATE] in a list.

## Blockquote
> Quoted [VERIFY] inside a blockquote.
> Quoted [CITATION NEEDED] bolded inside a blockquote.
> Quoted [USER INPUT NEEDED] inside a blockquote.
> Quoted [ESTIMATED] inside a blockquote.
> Quoted [CHECK DATE] inside a blockquote.

## Table cells
| Column A | Column B |
|----------|----------|
| Plain [VERIFY] | Plain [CITATION NEEDED] |
| Plain [USER INPUT NEEDED] | Plain [ESTIMATED] |
| Plain [CHECK DATE] | Done |

## Code blocks (these MUST NOT be detected)
Inline `[VERIFY]` should remain literal.

```
Block [CITATION NEEDED] should also remain literal.
[USER INPUT NEEDED] same here.
```

## Tag with hint
[CITATION NEEDED: epidemiology meta-analysis, Malaysia, 2022 or later]
**[USER INPUT NEEDED: clinic name and city]**
