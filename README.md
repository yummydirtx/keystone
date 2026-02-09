# Keystone: Open Source

## Alex Frutkin

This repo is the open source version of Keystone: Shared Budgets and Reimbursements, which is available at https://gokeystone.org and on the Apple App Store.

## Why not open source the production repos?

Ideally I would have done that, however, early in development I committed secrets to main and in the interest of not leaking those secrets I have instead created this repo to contain the code as of 02/08/26.

The keystone-front repo currently (as of 10/29/25) is sitting at 543 commits, and the keystone-backend repo has 131 commits. The README within the keystone-front folder in this repo should contain most of the necessary information to setup and selfhost another instance of Keystone, although this repo was created to showcase the source code.
