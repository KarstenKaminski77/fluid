<?php

namespace App\Controller;

use App\Entity\BasketItems;
use App\Entity\Baskets;
use App\Entity\DistributorProducts;
use App\Entity\Distributors;
use App\Entity\ListItems;
use App\Entity\Lists;
use App\Entity\ProductFavourites;
use App\Entity\Products;
use Doctrine\ORM\EntityManagerInterface;
use Nzo\UrlEncryptorBundle\Encryptor\Encryptor;
use phpDocumentor\Reflection\Types\This;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ListsController extends AbstractController
{
    private $em;
    private $encryptor;

    public function __construct(EntityManagerInterface $em, Encryptor $encryptor) {

        $this->em = $em;
        $this->encryptor = $encryptor;
    }

    #[Route('/clinics/inventory/get-lists', name: 'inventory_get_lists')]
    public function clinicsGetListsAction(Request $request): Response
    {
        $clinic = $this->get('security.token_storage')->getToken()->getUser()->getClinic();
        $lists = $this->em->getRepository(Lists::class)->getClinicLists($clinic->getId());
        $productId = (int) $request->request->get('id');

        // user permissions
        if(is_array($request->request->get('permissions'))){

            $permissions = json_decode($request->request->get('permissions'), true);

        } else {

            $permissions = json_decode($request->request->get('permissions'), true);
        }

        $response = '<h5 class="pb-3 pt-3">Order Lists</h5>';

        if(count($lists) == 0){

            $response = '<h5 class="pb-3 pt-3">Order Lists</h5><p id="lists_no_data">You do not currently have any 
            Order Lists on Fluid<br><br>Have Order Lists with your suppliers? We\'ll import them! Send us a message 
            using the chat icon in the lower right corner and we will help import you lists! You can also create new lists 
            using the Create List button below</p>';

        } else {

            for($i = 0; $i < count($lists); $i++){

                $isAuthorised = true;
                $tag = 'a';
                $classAdd = 'list_add_item';
                $classRemove = 'list_remove_item';

                if(!in_array(2, $permissions)){

                    $isAuthorised = false;
                    $tag = 'span';
                    $classAdd = 'text-disabled';
                    $classRemove = 'text-disabled';
                }

                if(count($lists[$i]->getListItems()) > 0) {

                    $itemCount = true;

                    $itemId = $lists[$i]->getListItems()[0]->getList()->getListItems()[0]->getId();
                    $isSelected = false;

                    for($c = 0; $c < count($lists[$i]->getListItems()); $c++){

                        if($lists[$i]->getListItems()[$c]->getProduct()->getId() == $productId){

                            $isSelected = true;
                            break;
                        }
                    }

                    if($isSelected) {

                        $icon = '
                        <'. $tag .' href="" class="'. $classRemove .'" data-id="' . $productId . '" data-value="' . $itemId . '">
                            <i class="fa-solid fa-circle-check pe-2 list-icon list-icon-checked"></i>
                        </'. $tag .'>';

                    } else {

                        $icon = '
                        <'. $tag .' href="" class="'. $classAdd .'" data-id="'. $productId .'" data-value="'. $lists[$i]->getId() .'">
                            <i class="fa-solid fa-circle-plus pe-2 list-icon list-icon-unchecked"></i>
                        </'. $tag .'>';
                    }

                } else {

                    $itemCount = false;

                    $icon = '
                    <'. $tag .' href="" class="'. $classAdd .'" data-id="'. $productId .'" data-value="'. $lists[$i]->getId() .'">
                        <i class="fa-solid fa-circle-plus pe-2 list-icon list-icon-unchecked"></i>
                    </'. $tag .'>';
                }

                $response .= $this->getListRow($icon, $lists[$i]->getName(), $lists[$i]->getId(), $itemCount, $request->request->get('keyword'));
            }
        }

        $response .= $this->listCreateNew($productId, $request->request->get('keyword'));

        return new JsonResponse($response);
    }

    #[Route('/clinics/inventory/remove-list-item', name: 'inventory_remove_list_item')]
    public function clinicsRemoveListsItemAction(Request $request): Response
    {
        $itemId = $request->request->get('id');
        $listItem = $this->em->getRepository(ListItems::class)->find($itemId);

        $this->em->remove($listItem);
        $this->em->flush();

        $response = $this->clinicsGetListsAction($request);

        return new JsonResponse($response);
    }

    #[Route('/clinics/inventory/remove-list-item', name: 'inventory_remove_list_item')]
    public function clinicsAddListsItemAction(Request $request): Response
    {
        $itemId = $request->request->get('item_id');
        $listItem = $this->em->getRepository(ListItems::class)->find($itemId);

        $this->em->remove($listItem);
        $this->em->flush();

        $response = $this->clinicsGetListsAction($request);

        return new JsonResponse($response);
    }

    #[Route('/clinics/manage-lists', name: 'manage_lists')]
    public function manageListsAction(Request $request): Response
    {
        $clinic = $this->getUser()->getClinic();
        $listId = $request->request->get('list_id') ?? 0;

        // user permissions
        if(is_array($request->request->get('permissions'))){

            $permissions = json_decode($request->request->get('permissions'), true);

        } else {

            $permissions = json_decode($request->request->get('permissions'), true);
        }

        if($listId > 0){

            // Delete List Items
            $listItems = $this->em->getRepository(ListItems::class)->findBy([
                'list' => $listId,
            ]);

            if(count($listItems) > 0){

                foreach($listItems as $item){

                    $this->em->remove($item);
                    $this->em->flush();
                }
            }

            // Delete List
            $list = $this->em->getRepository(Lists::class)->find($listId);

            $this->em->remove($list);
            $this->em->flush();
        }

        $lists = $this->em->getRepository(Lists::class)->findWithItemId($clinic->getId());

        $html = '
        <div class="row">
            <div class="col-12 text-center pt-3 pb-3 form-control-bg-grey border-bottom">
                <h4 class="text-primary">Order Lists</h4>
                <span class="text-primary">
                    Order Lists make it easy to repurchase your most commonly ordered items
                    Add items to lists while you shop and save time on every order.
                </span>
            </div>
        </div>
        <div class="row">
            <div class="col-12 half-border">';

            foreach($lists as $list){

                $isAuthorised = true;
                $tag = 'a';
                $classDelete = 'delete-list';
                $classEdit = 'edit-list';

                if(is_array($permissions) && !in_array(2, $permissions)){

                    $isAuthorised = false;
                    $tag = 'span';
                    $classDelete = 'text-disabled';
                    $classEdit = 'text-disabled';
                }

                $deleteIcon = '';
                $listType = 'Default';

                if($list->getIsProtected() == 0){

                    $deleteIcon = '
                    <'. $tag .' 
                        href="#" 
                        class="delete-list float-end me-3 '. $classDelete .'"
                        data-list-id="'. $list->getId() .'"
                        data-bs-toggle="modal" 
                        data-bs-target="#modal_list_delete"
                    >
                        <i class="fa-solid fa-trash-can"></i>
                    </'. $tag .'>';

                    $listType = 'Custom';
                }

                $tag = 'a';
                $class = '';

                if($list->getListItems()->count() == 0){

                    $tag = 'span';
                    $class = 'text-disabled';
                }

                $html .= '
                <div class="row pt-3 pb-3 border-bottom-dashed border-left border-right t-row">
                    <div class="col-7 col-sm-9 col-md-10">
                        <b>'. $list->getName() .' ('. $list->getListItems()->count() .')</b><br>
                        Fluid '. $listType .' List
                    </div>
                    <div class="col-5 col-sm-3 col-md-2">
                        <'. $tag .' 
                            href="#" 
                            class="view-list float-end text view-list '. $class .'"
                            data-list-id="'. $list->getId() .'"
                            data-keyword-string="'. $request->request->get('keyword') .'"
                        >
                            <i class="fa-solid fa-eye"></i>
                        </'. $tag .'>
                        <'. $tag .' 
                            href=""
                            class="float-end me-3 '. $classEdit .' '. $class .'"
                            data-list-id="'. $list->getId() .'"
                        >
                            <i class="fa-solid fa-pen-to-square"></i>
                        </'. $tag .'>
                        '. $deleteIcon .'
                    </div>
                </div>';
            }

            $html .= '
                </div>
            </div>
            <!-- Modal Delete List -->
            <div class="modal fade" id="modal_list_delete" tabindex="-1" aria-labelledby="list_delete_label" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="list_delete_label">Delete list</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-12 mb-0">
                                    Are you sure you would like to delete this list? This action cannot be undone.
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary btn-sm" data-bs-dismiss="modal">CANCEL</button>
                            <button type="button" class="btn btn-danger btn-sm" id="delete_list">DELETE</button>
                        </div>
                    </div>
                </div>
            </div>';

        $flash = '<b><i class="fas fa-check-circle"></i> Shopping list successfully deleted.<div class="flash-close"><i class="fa-solid fa-xmark"></i></div>';

        $response = [
            'response' => $html,
            'flash' => $flash,
        ];

        return new JsonResponse($response);
    }

    #[Route('/clinics/inventory/manage-list', name: 'inventory_manage_list')]
    public function clinicsManageListAction(Request $request): Response
    {
        $data = $request->request;
        $clinic = $this->get('security.token_storage')->getToken()->getUser()->getClinic();
        $products = $this->em->getRepository(Products::class)->find($data->get('product_id'));
        $distributor = $this->em->getRepository(Distributors::class)->find($data->get('distributor_id') ?? 0);
        $distributorProduct = $this->em->getRepository(DistributorProducts::class)->findOneBy([
            'distributor' => $request->request->get('distributor_id'),
            'product' => $request->request->get('product_id')
        ]);

        $productId = (int) $data->get('product_id');
        $listId = (int) $data->get('list_id');
        $listType = $data->get('list_type');
        $listName = $data->get('list_name');

        // List
        if($listId == 0){

            $list = new Lists();

            $list->setItemCount(1);
            $list->setListType($listType);
            $list->setClinic($clinic);
            $list->setIsProtected(0);
            $list->setName($listName);

            $this->em->persist($list);
            $this->em->flush();

        } else {

            $list = $this->em->getRepository(Lists::class)->find($listId);
        }

        // List item
        if(!$data->get('delete') && $distributorProduct != null) {

            $listItem = new ListItems();

            $listItem->setList($list);
            $listItem->setProduct($products);
            $listItem->setDistributor($distributor);
            $listItem->setDistributorProduct($distributorProduct);
            $listItem->setItemId($distributorProduct->getItemId());
            $listItem->setName($products->getName());
            $listItem->setQty(1);

            $this->em->persist($listItem);
            $this->em->flush();
        }

        // Favourites
        if($data->get('favourite') == 'true'){

            if($data->get('delete')) {

                $productFavourite = $this->em->getRepository(ProductFavourites::class)->findOneBy([
                    'product' => $productId,
                    'clinic' => $clinic->getId()
                ]);

                $listItem = $this->em->getRepository(ListItems::class)->findOneBy([
                    'product' => $productId,
                    'list' => $listId
                ]);

                $this->em->remove($productFavourite);
                $this->em->remove($listItem);

            } else {

                $clinic = $this->getUser()->getClinic();
                $list = $this->em->getRepository(Lists::class)->findOneBy([
                    'clinic' => $clinic,
                    'listType' => 'favourite',
                ]);

                $productFavourite = new ProductFavourites();

                $productFavourite->setClinic($clinic);
                $productFavourite->setProduct($products);

                $this->em->persist($productFavourite);

            }

            $this->em->flush();

            return new JsonResponse(['is_favourite' => true]);
        }

        $lists = $this->em->getRepository(Lists::class)->getClinicLists($clinic->getId());

        $response = '<h3 class="pb-3 pt-3">Order Lists</h3>';

        for($i = 0; $i < count($lists); $i++){

            if(count($lists[$i]->getListItems()) > 0) {

                $itemCount = true;
                $itemId = $lists[$i]->getListItems()[0]->getList()->getListItems()[0]->getId();
                $isSelected = false;

                for($c = 0; $c < count($lists[$i]->getListItems()); $c++){

                    if($lists[$i]->getListItems()[$c]->getProduct()->getId() == $productId){

                        $isSelected = true;
                        break;
                    }
                }

                if($isSelected) {

                    $icon = '<a href="" class="list_remove_item" data-id="' . $productId . '" data-value="' . $itemId . '">
                            <i class="fa-solid fa-circle-check pe-2 list-icon list-icon-checked"></i>
                        </a>';

                } else {

                    $icon = '<a href="" class="list_add_item" data-id="'. $productId .'" data-value="'. $lists[$i]->getId() .'">
                            <i class="fa-solid fa-circle-plus pe-2 list-icon list-icon-unchecked"></i>
                        </a>';
                }

            } else {

                $itemCount = false;

                $icon = '<a href="" class="list_add_item" data-id="'. $productId .'" data-value="'. $lists[$i]->getId() .'">
                            <i class="fa-solid fa-circle-plus pe-2 list-icon list-icon-unchecked"></i>
                        </a>';
            }

            $response .= $this->getListRow($icon, $lists[$i]->getName(), $lists[$i]->getId(), $itemCount);
        }

        $response .= $this->listCreateNew($productId);

        return new JsonResponse($response);
    }

    #[Route('/clinics/inventory/delete-list-item', name: 'inventory_delete_list_item')]
    public function clinicsDeleteListItemAction(Request $request): Response
    {
        $data = $request->request;
        $productId = (int) $data->get('product_id');
        $listId = (int) $data->get('list_id');
        $clinic = $this->get('security.token_storage')->getToken()->getUser()->getClinic();
        $listItem = $this->em->getRepository(ListItems::class)->find($listId);

        $this->em->remove($listItem);
        $this->em->flush();

        $lists = $this->em->getRepository(Lists::class)->getClinicLists($clinic->getId());

        $response = '<h3 class="pb-3 pt-3">Order Lists</h3>';

        for($i = 0; $i < count($lists); $i++){

            if(count($lists[$i]->getListItems()) > 0) {

                $itemCount = true;

                $itemId = $lists[$i]->getListItems()[0]->getList()->getListItems()[0]->getId();
                $isSelected = false;

                for($c = 0; $c < count($lists[$i]->getListItems()); $c++){

                    if($lists[$i]->getListItems()[$c]->getProduct()->getId() == $productId){

                        $isSelected = true;
                        break;
                    }
                }

                if($isSelected) {

                    $icon = '<a href="" class="list_remove_item" data-id="' . $productId . '" data-value="' . $itemId . '">
                            <i class="fa-solid fa-circle-check pe-2 list-icon list-icon-checked"></i>
                        </a>';

                } else {

                    $icon = '<a href="" class="list_add_item" data-id="'. $productId .'" data-value="'. $lists[$i]->getId() .'">
                            <i class="fa-solid fa-circle-plus pe-2 list-icon list-icon-unchecked"></i>
                        </a>';
                }

            } else {

                $itemCount = false;

                $icon = '<a href="" class="list_add_item" data-id="'. $productId .'" data-value="'. $lists[$i]->getId() .'">
                            <i class="fa-solid fa-circle-plus pe-2 list-icon list-icon-unchecked"></i>
                        </a>';
            }

            $response .= $this->getListRow($icon, $lists[$i]->getName(), $lists[$i]->getId(), $itemCount);
        }

        $response .= $this->listCreateNew($productId);

        return new JsonResponse($response);
    }

    #[Route('/clinics/inventory/edit/list', name: 'inventory_edit_list')]
    public function clinicsEditListAction(Request $request): Response
    {
        $data = $request->request;
        $list = $this->em->getRepository(Lists::class)->getIndividualList($data->get('list_id'));
        $col = '12';
        $listHasItems = false;
        $moveToBasket = true;

        // user permissions
        if(is_array($request->request->get('permissions'))){

            $permissions = json_decode($request->request->get('permissions'), true);

        } else {

            $permissions = json_decode($request->request->get('permissions'), true);
        }

        $response = $this->getEditList($list,$col,$listHasItems,$moveToBasket, $permissions);

        return new JsonResponse($response);
    }

    #[Route('/clinics/inventory/get-list-modal', name: 'inventory_get_list_modal')]
    public function clinicsListModalAction(Request $request): Response
    {
        $distributorProducts = $this->em->getRepository(DistributorProducts::class)->findWithItemId(
            $request->request->get('product_id')
        );

        $currency = $this->getUser()->getClinic()->getCountry()->getCurrency();

        $response = '
        <!-- Modal Distributor List -->
        <div class="modal fade" id="modal_list_distributors" tabindex="-1" aria-labelledby="list_distributors_label" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="list_distributors_label">
                            Available Distributors
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-12 mb-0">
                                <select class="form-control" id="list_distributor_id">
                                    <option value="">Select a distributor... </option>';

                                foreach($distributorProducts as $distributorProduct){

                                    $response .= '
                                    <option value="'. $distributorProduct->getDistributor()->getId() .'">
                                        '. $this->encryptor->decrypt($distributorProduct->getDistributor()->getDistributorName()) .' 
                                        '. $currency .' '. number_format($distributorProduct->getUnitPrice(),2) .'
                                    </option>';
                                }

                                $response .= '                            
                                </select>   
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger btn-sm" data-bs-dismiss="modal">CANCEL</button>
                        <button 
                            type="button" 
                            class="btn btn-primary btn-sm" 
                            id="save_list_distributor"
                            data-id="'. $request->request->get('product_id') .'"
                            data-value="'. $request->request->get('list_id') .'"
                        >SAVE</button>
                    </div>
                </div>
            </div>
        </div>';

        return new JsonResponse($response);
    }

    #[Route('/clinics/inventory/list/update-qty', name: 'inventory_list_update_qty')]
    public function clinicsListUpdateQtyAction(Request $request): Response
    {
        $listItem = $this->em->getRepository(ListItems::class)->find($request->request->get('list_item_id'));
        $response['list_id'] = 0;

        if($listItem != null){

            $listItem->setQty($request->request->get('qty'));

            $this->em->persist($listItem);
            $this->em->flush();

            $response['list_id'] = $listItem->getList()->getId();
        }

        $response['flash'] = '
        <b><i class="fas fa-check-circle"></i> 
        Shopping list successfully updated.<div class="flash-close"><i class="fa-solid fa-xmark"></i></div>';

        return new JsonResponse($response);
    }

    #[Route('/clinics/inventory/list/remove-item', name: 'list_remove_item')]
    public function clinicsListRemoveItemAction(Request $request): Response
    {
        $itemId = $request->request->get('list_item_id');
        $item = $this->em->getRepository(ListItems::class)->find($itemId);
        $listId = $item->getList()->getId();
        $col = '12';
        $listHasItems = false;
        $moveToBasket = true;

        // If favourite
        if($item->getList()->getListType() == 'favourite'){

            $productFavourite = $this->em->getRepository(ProductFavourites::class)->findOneBy([
                'product' => $item->getProduct()->getId(),
                'clinic' => $this->getUser()->getClinic()->getId()
            ]);

            if($productFavourite != null){

                $this->em->remove($productFavourite);
            }
        }

        if($item != null){

            $this->em->remove($item);
        }

        $this->em->flush();

        // user permissions
        if(is_array($request->request->get('permissions'))){

            $permissions = json_decode($request->request->get('permissions'), true);

        } else {

            $permissions = json_decode($request->request->get('permissions'), true);
        }

        $list = $this->em->getRepository(Lists::class)->getIndividualList($listId);

        if(count($list) > 0) {

            $response = $this->getEditList($list, $col, $listHasItems, $moveToBasket, $permissions);

        } else {

            $request->attributes->set('list_id', 0);
            $request->attributes->set('permissions', json_encode($permissions));

            $resp = json_decode($this->manageListsAction($request)->getContent(), true);
            $response = [
                'html' => $resp['response'],
                'flash' => $resp['flash'],
                'hasItems' => $listHasItems,
            ];
        }

        return new JsonResponse($response);
    }

    #[Route('/clinics/inventory/list/basket/add', name: 'list_add_to_basket')]
    public function clinicsListAddToBasketAction(Request $request): Response
    {
        $data = $request->request;
        $listId = $data->get('list_id');
        $clinicId = $data->get('clinic_id');
        $clearBasket = $data->get('clear_basket');
        $basketTotal = 0;

        $list = $this->em->getRepository(Lists::class)->getIndividualList($listId);
        $basket = $this->em->getRepository(Baskets::class)->findOneBy([
            'clinic' => $clinicId,
            'isDefault' => 1,
            'status' => 'active'

        ]);

        // Clear Basket
        if($clearBasket == 1){

            foreach($basket->getBasketItems() as $item){

                $basketItem = $this->em->getRepository(BasketItems::class)->find($item->getId());
                $this->em->remove($basketItem);
            }

            $this->em->flush();
        }

        foreach($list[0]->getListItems() as $item){

            $basketItem = new BasketItems();
            $product = $this->em->getRepository(Products::class)->find($item->getProduct());
            $distributor = $this->em->getRepository(Distributors::class)->find($item->getDistributor());
            $total = $item->getQty() * $product->getUnitPrice();
            $basketTotal += $total;

            $basketItem->setBasket($basket);
            $basketItem->setProduct($product);
            $basketItem->setDistributor($distributor);
            $basketItem->setName($item->getName());
            $basketItem->setQty($item->getQty());
            $basketItem->setUnitPrice($product->getUnitPrice());
            $basketItem->setTotal($total);
            $basketItem->setItemId($item->getItemId());

            $this->em->persist($basketItem);
        }

        $basket->setTotal($basketTotal);
        $this->em->persist($basket);

        $this->em->flush();

        return new JsonResponse($basket->getId());
    }

    private function getListRow($icon, $listName, $listId, $itemCount, $keyword = ''){

        if($itemCount == true){

            $link = '
            <a 
                href="" data-keyword-string="'. $keyword .'" class="float-end view-list" data-list-id="'. $listId .'">View List</a>';

        } else {

            $link = '<span class="float-end view-list disabled">View List</span>';
        }

        return '
                <div class="row p-2">
                    <div class="col-8 col-sm-10 ps-1 d-flex flex-column">
                        <table style="height: 30px;">
                            <tr>
                                <td class="align-middle" width="50px">
                                    '. $icon .'
                                </td>
                                <td class="align-middle info">
                                    '. $listName .'
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-4 col-sm-2">
                        '. $link .'
                    </div>
                </div>
            ';
    }

    private function listCreateNew($productId, $keyword = '')
    {
        return '
            <div class="row mt-4">
                <div class="col-12 col-sm-9">
                    <form name="form_list" id="form_list" method="post">
                        <input type="hidden" name="product_id" value="'. $productId .'">
                        <input type="hidden" name="list_id" value="0">
                        <input type="hidden" name="list_type" value="custom">
                        <div class="row">
                            <div class="col-12 col-sm-8">
                                <input type="text" name="list_name" id="list_name" class="form-control mb-3 mb-sm-0">
                                <div class="hidden_msg" id="error_list_name">
                                    Required Field
                                </div>
                            </div>
                            <div class="col-12 col-sm-4">
                                <button type="submit" class="btn btn-primary mb-3 mb-sm-0 w-100 w-sm-100" id="list_create_new">
                                    <i class="fa-solid fa-circle-plus"></i>
                                    &nbsp;CREATE NEW
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="col-12 col-sm-3">
                    <a href="" data-keyword-string="'. $keyword .'" class="btn btn-secondary float-end w-100 w-sm-100 manage-lists">
                        VIEW AND MANAGE YOUR LISTS 
                    </a>
                </div>
            </div>';
    }

    private function getEditList($list,$col,$listHasItems,$moveToBasket, $permissions)
    {
        if(array_key_exists(0, $list)) {

            if (count($list[0]->getListItems()) > 0) {

                $col = '9';
                $listHasItems = true;
            }
        }

        $isAuthorised = true;
        $isPlaceOrderAuthorised = true;
        $disabled = '';
        $currency = $this->getUser()->getClinic()->getCountry()->getCurrency();

        // Manage Order Lists
        if(is_array($permissions)) {

            if (!in_array(2, $permissions)) {

                $isAuthorised = false;
                $disabled = 'disabled';
            }

            // Place Orders
            if (!in_array(3, $permissions)) {

                $isPlaceOrderAuthorised = false;
            }
        }

        $html = '
        <div class="row">
            <div class="col-12 col-100 border-bottom bg-light">
                <!-- Basket Name -->
                <div class="row">
                    <div class="col-12 text-center pt-3 pb-3 form-control-bg-grey" id="basket_header">
                        <h4 class="text-primary">'. $list[0]->getName() .'</h4>
                        <span class="text-primary">
                            Manage All Your Shopping Carts In One Place
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-12 half-border">
                <div class="row border-bottom">
                    <div class="col-12 bg-light border-left border-right border-bottom">
                        <div class="col-12 pt-2 pb-2">
                            <input 
                                type="text" 
                                id="inventory_search" 
                                class="form-control" 
                                placeholder="Inventory Item" 
                                autocomplete="off" 
                                data-list-id="'. $list[0]->getId() .'"
                                '. $disabled .'
                            />
                            <div id="suggestion_field" style="display: none"></div>
                        </div>
                    </div>
                    <!-- Left Column -->
                    <div class="col-12 col-lg-'. $col .' border-left">';

                    $total = 0;

                    if(count($list[0]->getListItems()) > 0) {

                        foreach ($list[0]->getListItems() as $item){

                            $subTotal = $item->getDistributorProduct()->getUnitPrice() * $item->getQty();
                            $total += $subTotal;
                            $image = $item->getProduct()->getProductImages()->first()->getImage() ?? 'image-not-found.jpg';
                            $trackingId = $item->getDistributor()->getTracking()->getId();

                            $html .= '
                            <div class="row">
                                <div class="col-12 pt-3 pb-3 bg-light border-right">
                                    <!-- Product Name and Qty -->
                                    <div class="row">
                                        <!-- Thumbnail -->
                                        <div class="col-12 col-sm-1 col-md-12 col-lg-1 text-center pt-3 pb-3 mt-3 mt-sm-0">
                                            <img class="img-fluid basket-img" src="/images/products/'. $image .'">
                                        </div>
                                        <!-- Product Name -->
                                        <div class="col-12 col-sm-7 col-md-12 col-lg-7 pt-3 pb-3 text-center text-sm-start d-table">
                                            <div class="d-table-cell align-bottom">
                                                <span class="info">
                                                    '. $this->encryptor->decrypt($item->getDistributor()->getDistributorName()) .'
                                                </span>
                                                <h6 class="fw-bold text-primary lh-base mb-0">
                                                    '. $item->getProduct()->getName() . ': ' . $item->getProduct()->getDosage() . ' ' . $item->getProduct()->getUnit() .'
                                                </h6>
                                            </div>
                                        </div>
                                        <!-- Product Quantity -->
                                        <div class="col-12 col-sm-4 col-md-12 col-lg-4 pt-3 pb-3 d-table">
                                            <div class="row d-table-cell align-bottom">
                                                <div class="col-3 text-center text-sm-end text-md-start text-lg-start d-table-cell align-bottom">
                                                    '. number_format($item->getDistributorProduct()->getUnitPrice(),2) .'
                                                </div>
                                                <div class="col-4 d-table-cell">
                                                    <input 
                                                        type="text" 
                                                        list="qty_list_'. $item->getId() .'" 
                                                        data-list-item-id="'. $item->getId() .'" 
                                                        name="qty" 
                                                        class="form-control form-control-sm shopping-list-qty" 
                                                        value="'. $item->getQty() .'" 
                                                        ng-value="1"
                                                        '. $disabled .'
                                                    >
                                                    <datalist class="datalist" id="qty_list_'. $item->getId() .'">
                                                        <option>1</option>
                                                        <option>2</option>
                                                        <option>3</option>
                                                        <option>4</option>
                                                        <option>5</option>
                                                        <option>6</option>
                                                        <option>7</option>
                                                        <option>8</option>
                                                        <option>9</option>
                                                        <option>10</option>
                                                        <option>11</option>
                                                        <option>12</option>
                                                        <option>13</option>
                                                        <option>14</option>
                                                        <option>15</option>
                                                        <option>16</option>
                                                        <option>17</option>
                                                        <option>18</option>
                                                        <option>19</option>
                                                        <option>20</option>
                                                        <option id="qty_custom">Enter Quantity</option>
                                                    </datalist>
                                                    <div class="hidden_msg" id="error_qty_'. $item->getId() .'"></div>
                                                </div>
                                                <div class="col-5 text-center text-sm-start text-md-end fw-bold d-table-cell align-bottom">
                                                    '. $currency .' '. number_format($subTotal,2) .'
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Item Actions -->
                                    <div class="row">
                                        <div class="col-12">
                                            <!-- In Stock -->';
                                            if($item->getDistributorProduct()->getStockCount() == 0 && ($trackingId == 1 || $trackingId == 2)){

                                                $string = 'Out of Stock';
                                                $colour = 'danger';
                                                $moveToBasket = false;

                                            } elseif($item->getDistributorProduct()->getStockCount() < $item->getQty() && ($trackingId == 1 || $trackingId == 2)) {

                                                $string = 'Only '. $item->getDistributorProduct()->getStockCount() .' In Stock';
                                                $colour = 'warning';
                                                $moveToBasket = false;

                                            } else {

                                                $string = 'In Stock';
                                                $colour = 'success';
                                            }

                                            $shippingPolicy = $item->getDistributor()->getShippingPolicy();

                                            if($shippingPolicy == null){

                                                $shippingPolicy = $this->encryptor->decrypt($item->getDistributor()->getDistributorName()) . " hasn't updated their shipping policy.";
                                            }

                                            $html .= '
                                            <span class="badge bg-'. $colour .' me-0 me-sm-2 badge-'. $colour .'-filled-sm stock-status">'. $string .'</span>
                                            <!-- Shipping Policy -->
                                            <span 
                                                class="badge bg-dark-grey badge-pending-filled-sm" 
                                                data-bs-trigger="hover" 
                                                data-bs-container="body" 
                                                data-bs-toggle="popover" 
                                                data-bs-placement="top" 
                                                data-bs-html="true" 
                                                data-bs-content="'. $shippingPolicy .'" 
                                            >
                                                Shipping Policy
                                            </span>
                                            
                                            <!-- Remove Item -->';

                                            if($isAuthorised){

                                                $html .= '
                                                <span class="badge bg-danger float-end badge-danger-filled-sm remove-list-item">
                                                    <a 
                                                        href="#" 
                                                        class="remove-list-item text-white" 
                                                        data-item-id="'. $item->getId() .'"
                                                    >Remove</a>
                                                </span>';

                                            } else {

                                                $html .= '
                                                <span class="badge float-end bg-disabled">
                                                    <span 
                                                        href="#" 
                                                        data-item-id="'. $item->getId() .'"
                                                    >Remove</span>
                                                </span>';
                                            }

                                        $html .= '
                                        </div>
                                    </div>
                                </div>
                            </div>';
                        }

                    } else {

                        $html .= '
                        <div class="row">
                            <div class="col-md-12 text-center pt-5 pb-5 col-100 border-left border-right border-top border-bottom bg-light">
                                There are currently no items in this shopping list. 
                                Please use the search above to add items to this list
                            </div>
                        </div>';
                    }

                    $html .= '
                    </div>';

                    if($listHasItems) {

                        $html .= '
                            <!-- Right Column -->
                            <div class="col-12 col-lg-3 pt-3 pb-3 bg-light border-right col-cell">
                                <div class="row">
                                    <div class="col-12 text-truncate ps-0 ps-sm-2">
                                        <span class="info">Subtotal:</span>
                                        <h5 class="d-inline-block text-primary float-end">' . $currency .' '. number_format($total, 2) . '</h5>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-12 info ps-0 ps-sm-2">
                                        Shipping: <span class="float-end fw-bold">'. $currency.' 0.00</span>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-12 pt-4 text-center ps-0 ps-sm-2">';

                        if($moveToBasket){

                            if($isPlaceOrderAuthorised){

                                $html .= '
                                <a 
                                    href="" 
                                    class="btn btn-primary w-100" 
                                    id="btn_list_add_to_basket" 
                                    data-list-id="'. $item->getList()->getId() .'"
                                    data-bs-toggle="modal"
                                    data-bs-target="#modal_list_add_to_basket"
                                >
                                    ADD TO BASKET <i class="fa-solid fa-circle-plus ps-2"></i>
                                </a>';

                            } else {

                                $html .= '
                                <span 
                                    class="btn btn-primary w-100 btn-disabled" 
                                    style="cursor: text"
                                >
                                    ADD TO BASKET <i class="fa-solid fa-circle-plus ps-2"></i>
                                </span>';
                            }

                        } else {

                            $html .= '
                            <span 
                                class="btn btn-primary 
                                w-100 btn-disabled" 
                                style="cursor: text"
                            >
                                ADD TO BASKET <i class="fa-solid fa-circle-plus ps-2"></i>
                            </span>';
                        }

                        $html .= '
                                </div>
                            </div>
                        </div>';

                    }

                    $html .= '
                    </div>
                </div>
            <div>
            
            <!-- Modal Add To Basket -->
            <div class="modal fade" id="modal_list_add_to_basket" tabindex="-1" aria-labelledby="save_basket_label" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header basket-modal-header">
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body pb-0">
                            <div class="row">
                                <div class="col-12 mb-3">
                                    <h6>Clear current basket?</h6>
                                    Would you like to clear your Fluid Commerc basket before adding the shopping list items to it?
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-0">
                            <button 
                                class="btn btn-primary btn-sm list-add-basket" 
                                name="list_basket_save_clear" 
                                data-basket-clear="1"
                                data-list-id="'. $list[0]->getId() .'"
                                data-clinic-id="'. $this->getUser()->getClinic()->getId() .'"
                            >CLEAR AND ADD</button>
                            <button 
                                class="btn btn-danger btn-sm list-add-basket" 
                                name="list_basket_save" 
                                data-basket-clear="0"
                                data-list-id="'. $list[0]->getId() .'"
                                data-clinic-id="'. $this->getUser()->getClinic()->getId() .'"
                            >ADD</button>
                        </div>
                    </div>
                </div>
            </div>';

        $response = [

            'flash' => '<b><i class="fas fa-check-circle"></i> 
                        Shopping list successfully updated.<div class="flash-close"><i class="fa-solid fa-xmark"></i></div>',
            'html' => $html,
            'hasItems' => true,
        ];

        return $response;
    }
}