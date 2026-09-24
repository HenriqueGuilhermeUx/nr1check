create table if not exists nexoffice_links (
  id bigserial primary key,
  company_id integer not null references companies(id) on delete cascade,
  workspace_ref uuid not null,
  linked_by_user_id integer references users(id) on delete set null,
  linked_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id),
  unique(workspace_ref)
);

create index if not exists nexoffice_links_company_idx on nexoffice_links(company_id);
create index if not exists nexoffice_links_workspace_idx on nexoffice_links(workspace_ref);
