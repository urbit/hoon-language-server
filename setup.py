import setuptools
with open("README.md", "r") as fh:
    long_description = fh.read()
setuptools.setup(
    name='hoon-language-server',  
    version='0.1',
    scripts=['hoon-language-server'] ,
    author="Tlon",
    author_email="philip@tlon.io",
    description="Language Server for Hoon",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/urbit/hoon-language-server",
    packages=setuptools.find_packages(),
    install_requires=[
        'requests',
        'python-jsonrpc-server',
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
    ],
 )
