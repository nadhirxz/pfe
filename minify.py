import os
from jsmin import jsmin
from csscompressor import compress

cssdir = os.path.join(os.getcwd(), 'public', 'css')
css = list()

for (dirpath, dirnames, filenames) in os.walk(cssdir):
    css += [os.path.join(dirpath, file) for file in filenames if file.endswith('.css')]

jsdir = os.path.join(os.getcwd(), 'public', 'js')
jsdir2 = os.path.join(os.getcwd(), 'public', 'lang')
js = list()

for (dirpath, dirnames, filenames) in os.walk(jsdir):
    js += [os.path.join(dirpath, file) for file in filenames if file.endswith('.js')]
for (dirpath, dirnames, filenames) in os.walk(jsdir2):
    js += [os.path.join(dirpath, file) for file in filenames if file.endswith('.js')]

for file in css:
    with open(file, 'r', encoding='utf-8') as f:
        content = compress(f.read())
        save = open(file, 'w', encoding='utf-8')
        save.write(content)

for file in js:
    with open(file, 'r', encoding='utf-8') as f:
        if (file.endswith('map.js')): continue
        content = jsmin(f.read())
        save = open(file, 'w', encoding='utf-8')
        save.write(content)

print('Finished ..')