'''
    UNCOMMENT TEST CASE YOU WANT TO GENERATE

    also, to run:

    $ python3 customcasegenerator.py >> custominput.txt
'''

import random

# TEST CASE 1: 0 to 63
# for i in range(0, 64):
#     print(f"{i},", end='')

# TEST CASE 2: multiples of 3 beginning from 69
# for i in range(0, 64):
#     print(f"{69 + 3 * i},", end = '')

# TEST CASE 3; an actual random sequence
for i in range(0, 64):
    print(f"{random.randint(0, 1023)},", end='')