# Check Links Command

Validate that all links in $ARGUMENTS files are working and accessible.

## Task
Check all links (both internal and external) in the $ARGUMENTS file or directory and report:
- Broken links (404 errors, timeouts, unreachable)
- Invalid internal references
- Redirect chains
- Status of each link

## Process
1. Extract all markdown links from the file(s)
2. Test internal links (relative paths, anchors)
3. Test external URLs (HTTP/HTTPS requests)
4. Report results with clear status indicators

## Output Format
For each file checked, provide:
-  Working links
- L Broken links with error details
- � Warnings (redirects, slow responses)
- Summary statistics

Use tools like curl, wget, or web scraping to verify external links. For internal links, check file existence and anchor validity.