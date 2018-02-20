.. _zerynth-studio:

**************
Zerynth Studio
**************

Zerynth Studio is an integrated development environment (IDE) that runs on Windows, Linux and Mac.

Through Zerynth Studio all the supported boards can be managed and  programs can be developed in Python 3 or hybrid C/Python. Projects developed with Zerynth Studio can be saved locally or pushed as private git repository to the Zerynth backend.

.. figure:: /custom/img/zerynth_studio.jpg
   :align: center
   :figwidth: 100%  
   :alt: Zerynth Studio

Zerynth Studio includes:

* A code editor with syntax highlighting, multi-tab support, code auto-completion and error highlighting features;
* A seamless integration of all the :ref:`Zerynth Toolchain <ztc-main>` commands;
* Board discovery and management;
* Multiple serial port monitors;
* Git integration;
* Tens of code examples.

The Zerynth Studio interface is divided into functional areas: 

* :ref:`The Toolbar <zstudio-toolbar>`
* :ref:`The Code Editor <zstudio-code_editor>`
* :ref:`The Left Panel <zstudio-left_panel>`
* :ref:`The System Log <zstudio-system_log>`
* :ref:`The Footer bar <zstudio-footer>`


.. _zstudio-toolbar: 

The Toolbar
===========

The Toolbar is placed at the top of the Zerynth Studio window just under the system menubar. 

.. figure:: /custom/img/zstudio-toolbar.png
   :align: center 
   :figwidth: 100% 
   :alt: Zerynth Studio Toolbar

It contains two separate sections; on the left side there is the list of opened projects with the current one highlighted. Buttons to compile and uplink the current project lie just to the right of it. At the center of the toolbar there is the device management widget, whereas to the right of the screen, an account button allows accessing the user profile and assets.


.. _zerynth-studio-device:

Device Management Widget
------------------------

Zerynth Studio automatically recognizes connected devices, being them development boards, usb to serial converters or board programming tools. The connected devices are listed in the device management widget. The currently selected device will be used as a target device by the compiler and the uplinker.

.. figure:: /custom/img/select_device.jpg
   :align: center
   :figwidth: 60% 
   :alt: Select Device

By clicking "Choose target devices..." in the dropdown, it is possible to add a target device not physically connected the the development machine. This way, projects can be verified for such target, but obviously not uplinked.

The device discovery algorithm tries its best to infer the type of the connected device, but there are situations where this is not feasible without user intervention. In such cases, the discovered device is reported as "ambiguous" and the final choiche on the device type is left to the user.

Once a device has been connected, the buttons to the right of the device list allow the following interactions:

* *Device Registration & Virtualization*: by clicking the "Z" button, a registraion and virtualization dialog is displayed. If the target device has never been connected before, the only possible action is to register the device. The registration procedure is necessary to retrieve enough device information for allowing the Zerynth backend to build a virtual machine for the device. Once registration has been performed, the user is given the option to create a Virtual Machine for the registered deice. Here the user can select one of different virtual machines compatible with the target device. Finally, the created Virtual Machine can be virtualized (i.e. burned on the device). Some devices cannot be recognized automatically; for these devices, the dialog provides some more options to be specified before the actual registration/virtualization can take place. Finally, a device can always be registered again with the dedicated dialog button.
* *Serial Console*: by clicking the rightmost button,the serial port of the target device can be opened and the output inspected.
* *Device information and PinMap*: the central buttons can be used to retrieve device information (expecially the serial port and/or the mounted volume) and to show the device pinmap. Please refer to the :ref:`Programming Guide <ZERYNTHprog>` section for more details on how pin names and functionalities are organized in Zerynth.


When a serial console is opened, the port parameters are automatically configured to the defaults of the selected device. The baud rate for a device is displayed during bytecode upload. To open a serial port configured with a non default baudrate, a serial terminal like Putty should be used. It is important to close the serial terminal before trying to uplink or open a Zerynth serial console, because concurrent serial port usage from different programs is not allowed.

.. figure:: /custom/img/zerynth_serial_console.jpg
   :align: center
   :figwidth: 100% 
   :alt: Zerynth Serial Console


.. note:: The Zerynth Studio serial console also has scroll lock  and clear all console functions accessible from the top right corner of the console


The :ref:`Getting Started <gettingstarted>` section has a dedicated tutorial on how to manage devices.

.. _zerynth-studio-profile:

Zerynth Account Profile Section
-------------------------------

Zerynth Studio provides all Zerynth Account Profile information in the Profile Section that can be accessed by clicking the profile icon at the top right of the screen.

.. figure:: /custom/img/profile_section.png
   :align: center
   :figwidth: 100% 
   :alt: Profile Section

The Profile Section is divided into four main area:

* :ref:`Account Info <zerynth-studio-account-info>`;
* :ref:`Personal Info <zerynth-studio-personal-info>`;
* :ref:`Free Zerynth VMs Info <zerynth-studio-free-vms-info>`;
* :ref:`Production Zerynth VMs Info <zerynth-studio-production-vms-info>`.

.. _zerynth-studio-account-info:

Account Info Area
^^^^^^^^^^^^^^^^^

In this section the Zerynth User can retrieve the username and email inserted during the registration sequence and his asset.

.. note:: Pro User can also check their current subscription type (Monthly or Yearly) with the related renewal date and can manage their subscription at any time (like switching to different plans or downgrading to free user).

"Active Repositories" field shows the list of packages and library repositories available to the specific Zerynth User. The "Profile Completeness" bar shows the completion percentage of the user personal profile form.

.. _zerynth-studio-personal-info:

Personal Info Area
^^^^^^^^^^^^^^^^^^

In this area all personal information are displayed and the Zerynth User is free to fill the form, inserting the name, last name, age, country, job, company/organization and website.

After clicking the "save" button, the inserted information are stored and profile completeness percentage are recalculated.

.. _zerynth-studio-free-vms-info:

Free Zerynth VMs Section
^^^^^^^^^^^^^^^^^^^^^^^^

In this section the Zerynth User can monitor the status of the available free Zerynth VMs Asset; the table shows how many free VMs for each supported device have been used out of the total available.

.. _zerynth-studio-production-vms-info:

Production Zerynth VMs Section
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

In this area the Zerynth Pro User can check all the purchased Zerynth VMs Production assets in three different views:

* VMs - FreeRTOS: the table shows how many Zerynth Pro VMs with FreeRTOS have been consumed out of the total purchased, including the detail about the distribution of the consumed VMs among the available devices;
* VMs - ChibiOS: the table shows, as above, the status of the available and consumed Zerynth VMs with ChibiOS;
* Purchase History: the table shows the purchase history for the user; each row represents a Zerynth product purchase with related description, date, price, and receipt number for any reference.

.. note:: if a Pro User decides to downgrade to Free User, the Zerynth Pro Assets (like the Production VMs) will be frozen until a new upgrade to Zerynth Studio Pro.

.. _zstudio-code_editor:

Code Editor
===========

Zerynth Studio integrates a code editor based on the powerful `Ace <https://ace.c9.io/>`_ . 

The topmost part of the editor is reserved for tabs. Each tab displays a single project file and files belonging to different projects can be kept open at the same time.

At the bottom of the editor, a status bar displays information about the currently opened file together with a series of menus to alter the editor font and theme. The rightmost menu contains the useful editor commands.

.. figure:: /custom/img/details_current_file.jpg
   :align: center
   :figwidth: 75% 
   :alt: Editor status bar (left)

.. figure:: /custom/img/zerynth_studio_shortcut.jpg
   :align: center 
   :figwidth: 75% 
   :alt: Editor status bar (right)

Keyboard shortcuts are available:

* :kbd:`ctrl+c`/:kbd:`ctrl+v`/:kbd:`ctrl+x`: copy/paste/cut 
* :kbd:`ctrl+z`/:kbd:`ctrl+y`: undo/redo
* :kbd:`ctrl+f`: find in the current file
* :kbd:`ctrl+g`: find next
* :kbd:`ctrl+shift+g`: find previous
* :kbd:`ctrl+h`: find and replace
* :kbd:`ctrl+\\`: comment/uncomment selected lines
* :kbd:`tab`: indent more
* :kbd:`shift+tab`: indent less
* :kbd:`ctrl+alt+8`: auto pep8 (check and modify the script according to Python Enhancement Proposals 8 style convention)
* for more shortcuts refer to the `Ace shortcut page <https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts>`_


.. _zstudio-left_panel:

The Left Panel
==============

The vertical panel located to the left of the screen displays different information panels that can be selected by clicking one of the vertically stacked icons.

Project View
------------


The topmost icon selects the currently open project and the folder tree is shown. A double click on a project file opens it in the code editor.

The user can open more than one project and can switch from a project to another by selecting it from the project top bar.

.. figure:: /custom/img/opened_project_bar.jpg
   :align: center
   :figwidth: 100% 
   :alt: Opened Projects

Project related commands can be accessed both from the system menu and from the dropdowns in the top right corner of the project view.

.. figure:: /custom/img/current_project_panel.png
   :align: center 
   :figwidth: 75% 
   :alt: Current Project Panel

.. note:: **Drag and Drop** feature is available for the project view
   
   .. figure:: /custom/img/drug_and_drop.png
      :align: center
      :figwidth: 75% 
      :alt: Drag and Drop


Projects Browser
----------------

All projects known to Zerynth Studio are listed in the projects browser panel. Projects are grouped into "workspaces", where a workspace is the parent folder that contains them. Different workspaces are automatically added and removed to the projects browser as soon as a new project is created or the last project in a workspace is deleted, respectively. Projects are also "tagged" by an icon with the following meaning:

* closed folder: project save locally
* folder with git fork icon: project is saved remotely on the Zerynth backend
* folder with a book icon: project has been published as a library package

.. figure:: /custom/img/project_browser.jpg
   :align: center 
   :figwidth: 75% 
   :alt: Project Browser


Examples Browser
----------------

Zerynth Studio integrates an **Example browser** from which code examples can be cloned into projects. 
Examples are organized in a tree where different branches are usually labelled with the package namespace that provides them.

.. figure:: /custom/img/zerynth_studio_examples.jpg
   :align: center
   :figwidth: 100% 
   :alt: Zerynth Studio Examples 

In the :ref:`Getting Started <gettingstarted>` section a dedicated tutorial on how to use examples is available.


Library Manager
---------------

Zerynth Studio can be extended with new libraries from our community of users; these features are managed from the Library Manager panel, accessible by clicking the "puzzle" icon on the Left Panel

.. figure:: /custom/img/zerynth_package_manager.jpg
   :align: center
   :figwidth: 80%
   :alt: Zerynth Package Manager

To search and install a library:
   
   * type keywords in the search box and a list of matching libraries will be displayed.
   * choose “Install” or “Update” from the library info card
   * click “Install” in the summary popup for the library after choosing the version


A the top right corner of the Library Manager panel, a "refresh" button allows retrieving an updated list of the available community libraries. The list is refreshed automatically by Zerynth Studio every hour.


In the :ref:`Getting Started <gettingstarted>` section a dedicated tutorial on how to search, install and import packages is available.

News Feed
---------

Zerynth Studio is also a tool to stay connected with the **Zerynth community**. The "News Feed" tab displays the latest news available in the community forum about packages, updates, releases and bug fixes.

.. figure:: /custom/img/zerynth_news.jpg
   :align: center
   :figwidth: 90%
   :alt: Zerynth Studio News


Console List
------------

Each device output can be monitored through a dedicated serial console and each console lives in its own window. The console list panel is useful rapidly focus or close an opened console.

.. figure:: /custom/img/zstudio-consoles.png
   :align: center
   :figwidth: 65%
   :alt: Zerynth Studio Console List


ADM connected devices
---------------------

Devices present in the ADM database are shown in this panel. For each device, information about its status is displayed. If the device supports FOTA updates, the FOTA process can be performed directly from the provided buttons. More information on the ADM and FOTA updates can be found :ref:`here <zadm>` and :ref:`here <zadm-fota>`.

.. figure:: /custom/img/zerynth_admpanel.png
   :align: center
   :figwidth: 90%
   :alt: Zerynth Studio ADM panel



.. _zstudio-system_log:

System Log
==========

Zerynth Studio also includes a **System Log Panel** under the code editor where all system messages are reported. The displayed messages usually comes from the output of ZTC commands executed under the hood by Zerynth Studio. In case of error a full traceback of the exception can be generated: it should be copied and reported on the `community forum <https://community.zerynth.com>`_ to have it solved and fixed.


.. _zstudio-footer:

The Footer Bar
==============

A the bottom of the Zerynth Studio main window a footer bar displays two types of information:

* On the leftmost part, notification buttons appear when system updates or new supported boards are released. By clicking on the notification, the update process is started.
* On the rightmost part, a busy indicator appears during operations that takes some time to complete, like compiling, uplinking or updating the system
  
.. note:: When new versions of Zerynth Studio or of the Zerynth Toolchain are released, a manual restart of the Studio is required. The update process is non-disruptive and the previous working version of Zerynth Studio is preserved so that it can be started in case the new version has failed updating correctly.

.. _zstudio-quick_search:

Quick Search
============

Zerynth Studio has a quick search feature accessed through the shortcut :kbd:`Ctrl+P`. The quick search bar allows to search projects, examples and installed packages rapidly. Each search result is tagged with a type that can be :samp:`proj` for projects, :samp:`ex` for examples and and :samp:`doc` for package documentation. 

The quick search bar has some advanced features. It is possible to prefix the search query with the type of the desired result followed by a colon in order to restrict the search to the specified type. For example, typing :samp:`proj:blink` displays only the projects that match the query term "blink". 

Finally, by typing :samp:`:ztc` followed by a ZTC command, the specified command is executed and the output is shown in the System Log.

.. figure:: /custom/img/zstudio-quicksearch.png
   :align: center
   :figwidth: 90%
   :alt: Zerynth Studio Quick Search
