await showContextMenu(
  [
    new MenuItemText({
      label: t("sidebar.feed_column.context_menu.mark_as_read"),
      click: () => {
        subscriptionActions.markReadByFeedIds({
          feedIds: ids,
        })
      },
    }),
    new MenuItemSeparator(),
    new MenuItemText({
      label: t("sidebar.feed_column.context_menu.add_feeds_to_list"),
      submenu: listList
        ?.map(
          (list) =>
            new MenuItemText({
              label: list.title || "",
              click() {
                return addMutation.mutate({
                  feedIds: ids,
                  listId: list.id,
                })
              },
            }) as MenuItemInput,
        )
        .concat(listList?.length > 0 ? [new MenuItemSeparator()] : [])
        .concat([
          new MenuItemText({
            label: t("sidebar.feed_actions.create_list"),
            click: () => {
              present({
                title: t("sidebar.feed_actions.create_list"),
                content: () => <ListCreationModalContent />,
              })
            },
          }),
        ]),
    }),
    MenuItemSeparator.default,
    new MenuItemText({
      label: t("sidebar.feed_column.context_menu.change_to_other_view"),
      submenu: views
        .filter((v) => v.view !== view)
        .map(
          (v) =>
            new MenuItemText({
              label: t(v.name, { ns: "common" }),
              shortcut: (v.view + 1).toString(),
              icon: v.icon,
              click() {
                return changeCategoryView(v.view)
              },
            }),
        ),
    }),
    new MenuItemText({
      label: t("sidebar.feed_column.context_menu.rename_category"),
      click: () => {
        setIsCategoryEditing(true)
      },
    }),
    new MenuItemText({
      label: t("sidebar.feed_column.context_menu.delete_category"),
      hide: !folderName || isAutoGroupedCategory,
      click: () => {
        present({
          title: t("sidebar.feed_column.context_menu.delete_category_confirmation", {
            folderName,
          }),
          content: () => <CategoryRemoveDialogContent feedIdList={ids} />,
        })
      },
    }),
  ],
  e,
)
