// Idempotent CREATE TABLE statements — safe to run multiple times
export const SCHEMA_STATEMENTS = [
  `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='site_settings' AND xtype='U')
   CREATE TABLE site_settings (
     id                   INT           NOT NULL DEFAULT 1,
     site_owner_username  NVARCHAR(100) NOT NULL DEFAULT 'admin',
     site_owner_password  NVARCHAR(255) NOT NULL,
     must_change_password BIT           NOT NULL DEFAULT 1,
     company_name         NVARCHAR(255) NOT NULL DEFAULT 'ProjectHub',
     company_logo         NVARCHAR(MAX)     NULL,
     theme_mode           NVARCHAR(10)  NOT NULL DEFAULT 'light',
     color_config         NVARCHAR(MAX)     NULL,
     ui_colors            NVARCHAR(MAX)     NULL,
     filter_project       NVARCHAR(50)  NOT NULL DEFAULT 'all',
     sidebar_collapsed    BIT           NOT NULL DEFAULT 0,
     CONSTRAINT PK_site_settings PRIMARY KEY (id),
     CONSTRAINT CK_site_settings_single_row CHECK (id = 1)
   )`,

  `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='companies' AND xtype='U')
   CREATE TABLE companies (
     id         NVARCHAR(50)  NOT NULL PRIMARY KEY,
     name       NVARCHAR(255) NOT NULL,
     created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
   )`,

  `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='departments' AND xtype='U')
   CREATE TABLE departments (
     id         NVARCHAR(50)  NOT NULL PRIMARY KEY,
     company_id NVARCHAR(50)  NOT NULL,
     name       NVARCHAR(255) NOT NULL,
     color      NVARCHAR(20)  NOT NULL DEFAULT '#6366f1',
     created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
     CONSTRAINT FK_departments_company FOREIGN KEY (company_id)
       REFERENCES companies(id) ON DELETE CASCADE
   )`,

  `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='team_members' AND xtype='U')
   CREATE TABLE team_members (
     id            NVARCHAR(50)  NOT NULL PRIMARY KEY,
     company_id    NVARCHAR(50)  NOT NULL,
     name          NVARCHAR(255) NOT NULL,
     email         NVARCHAR(255) NOT NULL,
     avatar_color  NVARCHAR(20)  NOT NULL DEFAULT '#6366f1',
     role          NVARCHAR(50)  NOT NULL DEFAULT 'user',
     password      NVARCHAR(255) NOT NULL,
     department_id NVARCHAR(50)      NULL,
     is_disabled          BIT           NOT NULL DEFAULT 0,
     must_change_password BIT           NOT NULL DEFAULT 1,
     created_at           DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
     CONSTRAINT FK_team_members_company FOREIGN KEY (company_id)
       REFERENCES companies(id) ON DELETE CASCADE
   )`,

  // Add must_change_password to existing team_members tables (idempotent)
  `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('team_members') AND name = 'must_change_password')
   ALTER TABLE team_members ADD must_change_password BIT NOT NULL DEFAULT 1`,

  `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='projects' AND xtype='U')
   CREATE TABLE projects (
     id          NVARCHAR(50)  NOT NULL PRIMARY KEY,
     company_id  NVARCHAR(50)  NOT NULL,
     name        NVARCHAR(255) NOT NULL,
     description NVARCHAR(MAX)     NULL,
     color       NVARCHAR(20)  NOT NULL DEFAULT '#6366f1',
     status      NVARCHAR(20)  NOT NULL DEFAULT 'open',
     created_at  DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
     CONSTRAINT FK_projects_company FOREIGN KEY (company_id)
       REFERENCES companies(id) ON DELETE CASCADE
   )`,

  `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='project_members' AND xtype='U')
   CREATE TABLE project_members (
     project_id   NVARCHAR(50) NOT NULL,
     member_id    NVARCHAR(50) NOT NULL,
     project_role NVARCHAR(50) NOT NULL DEFAULT 'user',
     CONSTRAINT PK_project_members PRIMARY KEY (project_id, member_id),
     CONSTRAINT FK_project_members_project FOREIGN KEY (project_id)
       REFERENCES projects(id) ON DELETE CASCADE
   )`,

  `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tasks' AND xtype='U')
   CREATE TABLE tasks (
     id                    NVARCHAR(50)  NOT NULL PRIMARY KEY,
     project_id            NVARCHAR(50)  NOT NULL,
     title                 NVARCHAR(500) NOT NULL,
     description           NVARCHAR(MAX)     NULL,
     assignee_id           NVARCHAR(50)      NULL,
     department_id         NVARCHAR(50)      NULL,
     assign_to_all         BIT           NOT NULL DEFAULT 0,
     start_date            DATETIMEOFFSET    NULL,
     due_date              DATETIMEOFFSET    NULL,
     completion_percentage INT           NOT NULL DEFAULT 0,
     status                NVARCHAR(20)  NOT NULL DEFAULT 'todo',
     priority              NVARCHAR(20)  NOT NULL DEFAULT 'medium',
     created_at            DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
     CONSTRAINT FK_tasks_project FOREIGN KEY (project_id)
       REFERENCES projects(id) ON DELETE CASCADE
   )`,

  `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='task_dependencies' AND xtype='U')
   CREATE TABLE task_dependencies (
     task_id      NVARCHAR(50) NOT NULL,
     depends_on_id NVARCHAR(50) NOT NULL,
     CONSTRAINT PK_task_dependencies PRIMARY KEY (task_id, depends_on_id),
     CONSTRAINT FK_task_deps_task FOREIGN KEY (task_id)
       REFERENCES tasks(id) ON DELETE CASCADE
   )`,
];
