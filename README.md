## Functionalities of the application
### Auth
1. User can login using email and password.
2. User can reset password if forgot password by sending otp on mail
3. User can logout from account

### Admin
1. Admin can add new employee with details
2. Admin can view all employees
3. Admin can delete any employee
4. Admin can update any employee detail

5. Admin can add new leaders
6. Admin can view all leaders
7. Admin can delete any leader
8. Admin can update any leader detail

9. Admin can add new Admin
10. Admin can view all admins
11. Admin can delete any admin
12. Admin can update any admin detail

13. Admin can see attendence of employee with checkin-checkout time by searching date

14. Admin can see leave request of employee
15. Admin can approve or reject leave request

16. Admin can credit salary to each employee/leader/admin with base salary and bonus and mail gets sent
17. Admin can see total salary paid to each employee/leader/admin

18. Admin can add team by adding team name, leader and members
19. Admin can view all teams
20. Admin can delete any team
21. Admin can update any team detail

22. Admin can project name, description, startDate, endDate, status, completion, assignedTeams
23. Admin can view all projects
24. Admin can delete any project
25. Admin can update any project detail

26. Admin can verify docs uploaded in the profile of employee/leader 

27. Admin can schedule the holiday into calender and all users get mail about it
28. Admin can see calender of holidays

29. The mail is brodcast about todays celebrations from admin to all users

### Leader
1. leader can mark his attendence by check in and check out daily
2. leader can see his attendence marked by him

3. leader can see teams in which he is a part

4. leader can see all Projects under him

5. leader can apply for his own leaves
6. leader can see all Leaves requested by him
7. leader gets mail of leave status of each employee under him

9. leader assign a task to employee under his project
10. leader can see all tasks assigned by him with status

11. leader can upload documents in his profile and send it to admin for verification
12. leader can see his profile
13. leader can edit his profile

14. leader can see todays celebrations such as work/marriage anniversary or birthdays on attendance page

15. contact employee page to search employee information present in db

### Employee
1. employee can mark his attendence by check in and check out daily
2. employee can see his attendence marked by him

3. employee can apply for his own leaves
4. employee can see all Leaves requested by him
5. employee and his leader gets mail of leave requests status updated by admin

6. employee can see all Teams in which he is a part

7. employee can see tasks assigned by leader with status
8. employee can update status of Tasks assigned by leader to him

9. employee can see all Projects in which he is a part

10. employee can upload documents in his profile and send it to admin for verification
11. employee can see his profile
12. employee can edit his profile

13. leader can see todays celebrations such as work/marriage anniversary or birthdays on attendance page

14. contact employee page to search employee information present in db

## To be fixed:-
1. on attendance page of both employee and leader we can see calender but the date and day are not correct,
for eg. if today is 13/10/2025-Monday then in calender on same day it is Friday.
2. there should be red color to holidays and yellow color on leaves day, if attendance is not yet marked then 
white color and green color on attendence days marked by user in calender.
3. leader assign deadline for task while assigning task. if delay -> ask reason, if 3 times delay -> notify admin by mail
4. give 12 paid leaves yearly to each employee/leader & decrease them when his leave gets approved by by admin show his remaining leaves on leaves page
5. add report generation in admin dashboard by choosing employee/leader
6. after implementing all this DWI-EMS for developers will be done, move towards advanced features by adding departments

## Credentials:
1. Admin: admin@dw4u.com, password: admin123
2. Leader: swaraj@dw4u.com, password: swaraj123
3. Employee: purvajadhav9075@gmail.com, password: purva123
4. other credentials are available in admin dashboard employee/leader/admin pages table

## frontend .env file
VITE_API_BASE=http://localhost:5000/api

## backend .env file
MONGO_URI=mongodb+srv://purvajadhav9075:fBilVSpeOD0NPAvP@cluster0.pcmvp.mongodb.net/DWI_EMS?retryWrites=true&w=majority&appName=Cluster0
PORT=5000
JWT_SECRET=your_secret_key
MAIL_USER=purvajadhav8698@gmail.com
MAIL_PASS=lpdnjepovbnbpjhd
MAIL_NAME=DW Innovations Pvt. Ltd.
VITE_API_BASE_URL=http://localhost:5000/api
IMAGEKIT_PUBLIC_KEY=public_VRYmb1ssomyg/cLhacoKbqpfYRk=
IMAGEKIT_PRIVATE_KEY=private_2Ya4CoBM8qJXylSEJ23nKwAGkSQ=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/dwipng