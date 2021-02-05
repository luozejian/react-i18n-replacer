import json
import os


def cutFile(data:dict):
    zh_result = {}
    en_result = {}
    for key,item in data.items():
        if key not in zh_result.keys():
            zh_result[key] = {}
            en_result[key] = {}
        for i in item:
            zh_result[key][i[0]] = i[1]
            en_result[key][i[0]] = i[2]
    print("zh -" * 50)
    print(zh_result)
    print("en -"*50)
    print(en_result)
    # 输出的文件目录
    with open("./assets/internationalization/zh.json","w",encoding="utf8") as f:
        f.write(json.dumps(zh_result,ensure_ascii=False))
    with open("./assets/internationalization/en.json","w") as f:
        f.write(json.dumps(en_result))

def getFile(path):
    file_path = {}
    for root, dirs, files in os.walk(path):
        print(root)
        print(dirs)
        print(files)
        for file in files:
            file_path[file] = os.path.join(root,file)
    return file_path

def mergeFile(paths):
    result = {}
    for name,path in paths.items():
        print(name)
        with open(path,encoding="utf8") as f:
            data = f.read()
            data = json.loads(data)
            result[name.replace(".txt","")] = data
    return result


if __name__ == '__main__':
    file_path = getFile(r"./mapping")
#     file_path = getFile(r"./assets/internationalization")
    data = mergeFile(file_path)
    cutFile(data)
