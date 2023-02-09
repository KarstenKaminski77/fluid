<?php

namespace App\Controller;

use App\Entity\ApiDetails;
use App\Entity\DistributorProducts;
use App\Entity\Distributors;
use App\Entity\ListItems;
use App\Entity\Manufacturers;
use App\Entity\ProductManufacturers;
use App\Entity\Products;
use App\Entity\ProductsSpecies;
use App\Entity\Tracking;
use App\Services\PaginationManager;
use Doctrine\ORM\EntityManagerInterface;
use Nzo\UrlEncryptorBundle\Encryptor\Encryptor;
use phpDocumentor\Reflection\Types\This;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class DistributorProductsController extends AbstractController
{
    private $em;
    const ITEMS_PER_PAGE = 10;
    private $pageManager;
    private $requestStack;
    private $encryptor;

    public function __construct(EntityManagerInterface $em, PaginationManager $pagination, RequestStack $requestStack, Encryptor $encryptor) {
        $this->em = $em;
        $this->pageManager = $pagination;
        $this->requestStack = $requestStack;
        $this->encryptor = $encryptor;
    }

    #[Route('/distributors/update-stock', name: 'update_stock')]
    public function updateStockAction(Request $request): Response
    {
        $distributors = $this->em->getRepository(Distributors::class)->findAll();
        $distributorHasApi = 0;
        $distributorNoApi = 0;
        $totalItems = 0;

        if(count($distributors) > 0){

            foreach($distributors as $distributor){

                $api = $distributor->getApiDetails();

                if($api != null){

                    $distributorHasApi += 1;

                    // Get stock levels from API
                    $organizationId = $api->getOrganizationId();
                    $refreshToken = $api->getRefreshTokens()->first()->getToken();
                    $accessToken = $this->zohoGetAccessToken($refreshToken, $distributor->getId());

                    $items = $this->zohoGetAllItems($organizationId, $accessToken, 1, []);
                    $totalItems += count($items);

                    // Update fluid stock items
                    foreach($items as $item){

                        $itemId = $item['itemId'];
                        $stockOnHand = $item['stockOnHand'];

                        if(!empty($itemId)){

                            $distributorProduct = $this->em->getRepository(DistributorProducts::class)->findOneBy([
                                'itemId' => $itemId
                            ]);

                            if($distributorProduct != null){

                                $distributorProduct->setStockCount($stockOnHand);

                                $this->em->persist($distributorProduct);
                            }
                        }
                    }

                    $this->em->flush();

                } else {

                    $distributorNoApi += 1;
                }
            }
        }

        $response = [
            'distributorHasApi' => $distributorHasApi,
            'distributorNoApi' => $distributorNoApi,
            'totalItems' => $totalItems,
        ];

        return new JsonResponse($response);
    }

    #[Route('/distributors/import-products', name: 'import_products')]
    public function importProductsAction(Request $request): Response
    {
        $distributorId = $this->getUser()->getDistributor()->getId();
        $api = $this->em->getRepository(ApiDetails::class)->findOneBy([
            'distributor' => $distributorId
        ]);
        $totalItems = 0;

        if($api != null){

            $organizationId = $api->getOrganizationId();
            $refreshToken = $api->getRefreshTokens()->first()->getToken();
            $accessToken = $this->zohoGetAccessToken($refreshToken, $distributorId);

            $items = $this->zohoGetAllItems($organizationId, $accessToken, 1, []);

            if(is_array($items) && count($items) > 0){

                foreach($items as $item) {

                    $productRepo = $this->em->getRepository(Products::class)->findOneBy([
                        'name' => $item['itemName'],
                    ]);
                    $totalItems += 1;
                    $manufacturer = $item['manufacturer'];

                    // Save manufacturer
                    if(!empty($manufacturer)){

                        $manufacturerRepo = $this->em->getRepository(Manufacturers::class)->findOneBy([
                            'name' => $manufacturer
                        ]);

                        if($manufacturerRepo == null){

                            $manufacturerRepo = new Manufacturers();

                            $manufacturerRepo->setName($manufacturer);

                            $this->em->persist($manufacturerRepo);
                            $this->em->flush();
                        }
                    }

                    if($productRepo == null) {

                        $productRepo = new Products();
                    }

                    $productRepo->setName($item['itemName']);
                    $productRepo->setActiveIngredient('TBA');
                    $productRepo->setUnit('TBA');
                    $productRepo->setUnit($item['weightUnit']);
                    $productRepo->setUnitPrice($item['unitPrice']);
                    $productRepo->setStockCount($item['stockOnHand']);
                    $productRepo->setIsActive(1);
                    $productRepo->setIsPublished(0);
                    $productRepo->setExpiryDateRequired(0);

                    $this->em->persist($productRepo);
                }

                $this->em->flush();
            }

            // Update manufacturers
            if(count($items) > 0) {

                foreach ($items as $item) {

                    $manufacturer = $item['manufacturer'];
                    $itemName = $item['itemName'];

                    if(!empty($manufacturer)) {

                        $manufacturerRepo = $this->em->getRepository(Manufacturers::class)->findOneBy([
                            'name' => $manufacturer,
                        ]);
                        $product = $this->em->getRepository(Products::class)->findOneBy([
                            'name' => $itemName,
                        ]);
                        $productManufacturers = $this->em->getRepository(ProductManufacturers::class)->findOneBy([
                            'products' => $product->getId(),
                            'manufacturers' => $manufacturerRepo->getId(),
                        ]);

                        if($productManufacturers == null) {

                            $productManufacturers = new ProductManufacturers();
                        }

                        $productManufacturers->setManufacturers($manufacturerRepo);
                        $productManufacturers->setProducts($product);

                        $this->em->persist($productManufacturers);
                    }
                }

                $this->em->flush();
            }
        }

        $response['totalItems'] = $totalItems;

        return new JsonResponse($response);
    }

    #[Route('/distributors/import-distributor-products', name: 'distributor_import_products')]
    public function importDistributorProductsAction(Request $request): Response
    {
        $distributorId = $this->getUser()->getDistributor()->getId();
        $distributor = $this->em->getRepository(Distributors::class)->find($distributorId);
        $api = $this->em->getRepository(ApiDetails::class)->findOneBy([
            'distributor' => $distributorId,
        ]);
        $totalItems = 0;
        $response = '';

        if($api != null && $distributor->getTracking()->getId() != null) {

            $organizationId = $api->getOrganizationId();
            $refreshToken = $api->getRefreshTokens()->first()->getToken();
            $accessToken = $this->zohoGetAccessToken($refreshToken, $distributorId);

            $items = $this->zohoGetAllItems($organizationId, $accessToken, 1, []);

            if (is_array($items) && count($items) > 0) {

                foreach ($items as $item) {

                    $itemName = $item['itemName'];
                    $itemId = $item['itemId'];

                    if(!empty($itemId)){

                        // Find Product ID
                        $product = $this->em->getRepository(DistributorProducts::class)->findOneBy([
                            'itemId' => $itemId,
                        ]);

                        // Only import products with an existing parent
                        if($product != null && $product->getProduct() != null) {

                            $distributorProduct = $this->em->getRepository(DistributorProducts::class)->findOneBy([
                                'distributor' => $distributorId,
                                'product' => $product->getProduct()->getId(),
                            ]);

                            if($distributorProduct == null){

                                $distributorProduct = new DistributorProducts();
                            }

                            $distributorProduct->setDistributor($distributor);
                            $distributorProduct->setProduct($product->getProduct());
                            $distributorProduct->setItemId($item['itemId']);
                            $distributorProduct->setUnitPrice($item['unitPrice']);
                            $distributorProduct->setStockCount($item['stockOnHand']);
                            $distributorProduct->setTaxExempt(1);
                            $distributorProduct->setSku(0);
                            $distributorProduct->setIsActive(0);

                            $this->em->persist($distributorProduct);

                            $totalItems += 1;
                        }
                    }
                }

                $this->em->flush();

                $response = [
                    'totalItems' => $totalItems,
                    'flash' => '<b><i class="fa-solid fa-circle-check"></i></i></b> Products successfully imported.<div class="flash-close"><i class="fa-solid fa-xmark"></i></div>',
                ];
            }
        }

        return new JsonResponse($response);
    }

    #[Route('/distributors/delete/distributor-product', name: 'delete_distributor_product')]

    #[Route('/distributors/get/product-list', name: 'get_distributor_product_list')]
    public function getDistributorProductListAction(Request $request): Response
    {
        $pageId = $request->request->get('page-id') ?? 1;
        $distributorId = $this->getUser()->getDistributor()->getId();
        $manufacturerId = (int) $request->request->get('manufacturer-id') ?? 0;
        $speciesId = (int) $request->request->get('species-id') ?? 0;
        $distributorProductsRepo = $this->em->getRepository(Products::class)->findByManufacturer($distributorId,$manufacturerId,$speciesId);
        $distributorProducts = $this->pageManager->paginate($distributorProductsRepo[0], $request, self::ITEMS_PER_PAGE);
        $distributorProductsPagination = $this->getPagination($pageId, $distributorProducts, $distributorId);
        $manufacturers = $this->em->getRepository(ProductManufacturers::class)->findByDistributorManufacturer($distributorId);
        $species = $this->em->getRepository(ProductsSpecies::class)->findByDistributorProducts($distributorId);

        $html = '
        <div class="col-12">
            <div class="row">
                <div class="col-12 text-center mt-1 pt-3 pb-3" id="order_header">
                    <h4 class="text-primary text-truncate">Inventory</h4>
                </div>
            </div>
            <div class="row">
                <div class="col-12 bg-light border-top border-left border-right">
                    <div class="row">
                        <div class="col-12 col-md-3 offset-sm-0 offset-md-3 py-3">
                            <select
                                class="form-control"
                                name="manufacturer-id"
                                id="manufacturer_id"
                                data-action="change->products--distributor-products#onChangeFilter"
                            >
                                <option value="0">
                                    Select a Manufacturer
                                </option>';

                                foreach($manufacturers as $manufacturer)
                                {
                                    $html .= '
                                    <option value="'. $this->encryptor->decrypt($manufacturer->getManufacturers()->getId()) .'">
                                        '. $this->encryptor->decrypt($manufacturer->getManufacturers()->getName()) .'
                                    </option>';
                                }

                            $html .= '
                            </select>
                        </div>
                        <div class="col-12 col-md-3 py-3">
                            <select
                                class="form-control"
                                name="species-id"
                                id="species_id"
                                data-action="change->products--distributor-products#onChangeFilter"
                            >
                                <option value="0">
                                    Select a Species
                                </option>';

                                foreach($species as $specie)
                                {
                                    $html .= '
                                    <option value="'. $specie['species']['id'] .'">
                                        '. $specie['species']['name'] .'
                                    </option>';
                                }

                            $html .= '
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-12 d-none d-xl-block">
                    <div class="row">
                        <div class="col-md-3 pt-3 pb-3 text-primary fw-bold bg-light border-bottom border-left border-top">
                            Name
                        </div>
                        <div class="col-md-2 pt-3 pb-3 text-primary fw-bold bg-light border-bottom border-top">
                            Active Ingredient
                        </div>
                        <div class="col-md-1 pt-3 pb-3 text-primary fw-bold bg-light border-bottom border-top">
                            Dosage
                        </div>
                        <div class="col-md-1 pt-3 pb-3 text-primary fw-bold bg-light border-bottom border-top">
                            Size
                        </div>
                        <div class="col-md-1 pt-3 pb-3 text-primary fw-bold bg-light border-bottom border-top">
                            Unit
                        </div>
                        <div class="col-md-1 pt-3 pb-3 text-primary fw-bold bg-light border-bottom border-top">
                            Stock
                        </div>
                        <div class="col-md-1 pt-3 pb-3 text-primary fw-bold bg-light border-bottom border-top">
                            Price
                        </div>
                        <div class="col-md-2 pt-3 pb-3 text-primary fw-bold bg-light border-bottom border-right border-top">

                        </div>
                    </div>
                </div>
                <div class="col-12" id="inventory_list">';

                    foreach($distributorProducts as $distributorProduct)
                    {
                        $html .= '
                        <div 
                            class="row border-left border-right border-bottom bg-light" 
                            id="distributor_product_'. $distributorProduct->getDistributorProducts()[0]->getId() .'"
                        >
                            <div class="col-5 col-md-2 d-xl-none t-cell fw-bold text-primary text-truncate border-list pt-3 pb-3">
                                Name:
                            </div>
                            <div
                                class="col-7 col-md-3 col-xl-3 text-truncate border-list pt-3 pb-3"
                                data-bs-trigger="hover"
                                data-bs-container="body"
                                data-bs-toggle="popover"
                                data-bs-placement="top"
                                data-bs-html="true"
                                data-bs-content="'. $distributorProduct->getName() .'"
                            >
                                '. $distributorProduct->getName() .'
                            </div>
                            <div class="col-5 col-md-2 d-xl-none t-cell fw-bold text-primary text-truncate border-list pt-3 pb-3">
                                Active Ingredient:
                            </div>
                            <div class="col-7 col-md-2 col-xl-2 text-truncate border-list pt-3 pb-3">
                                '. $distributorProduct->getActiveIngredient() .'
                            </div>
                            <div class="col-5 col-md-1 d-xl-none t-cell fw-bold text-primary text-truncate border-list pt-3 pb-3">
                                Dosage:
                            </div>
                            <div class="col-7 col-md-1 col-xl-1 text-truncate border-list pt-3 pb-3">
                                '. $distributorProduct->getDosage() .'
                            </div>
                            <div class="col-5 col-md-2 d-xl-none t-cell fw-bold text-primary text-truncate border-list pt-3 pb-3">
                                Size:
                            </div>
                            <div class="col-7 col-md-1 col-xl-1 text-truncate border-list pt-3 pb-3">
                                '. $distributorProduct->getSize() .'
                            </div>
                            <div class="col-5 col-md-2 d-xl-none t-cell fw-bold text-primary text-truncate border-list pt-3 pb-3">
                                Unit:
                            </div>
                            <div class="col-7 col-md-1 col-xl-1 text-truncate border-list pt-3 pb-3">
                                '. $distributorProduct->getUnit() .'
                            </div>
                            <div class="col-5 col-md-2 d-xl-none t-cell fw-bold text-primary text-truncate border-list pt-3 pb-3">
                                Stock:
                            </div>
                            <div class="col-7 col-md-1 col-xl-1 text-truncate border-list pt-3 pb-3">
                                '. $distributorProduct->getDistributorProducts()[0]->getStockCount() .'
                            </div>
                            <div class="col-5 col-md-2 d-xl-none t-cell fw-bold text-primary text-truncate border-list pt-3 pb-3">
                                Price:
                            </div>
                            <div class="col-7 col-md-1 col-xl-1 text-truncate border-list pt-3 pb-3">
                                '. $distributorProduct->getDistributorProducts()[0]->getUnitPrice() .'
                            </div>
                            <div class="col-md-2  t-cell text-truncate border-list pt-3 pb-3">
                                <a
                                    href=""
                                    class="float-end update-product"
                                    data-product-name="'. $distributorProduct->getName() .'"
                                    data-product-id="'. $distributorProduct->getId() .'"
                                    data-action="click->products--distributor-products#onclickEditIcon"
                                >
                                    <i class="fa-solid fa-pen-to-square edit-icon"></i>
                                </a>
                                <a
                                    href=""
                                    class="delete-icon float-end delete-distributor-product"
                                    data-bs-toggle="modal"
                                    data-distributor-product-id="'. $distributorProduct->getDistributorProducts()[0]->getId() .'"
                                    data-bs-target="#modal_product_delete"
                                    data-action="click->products--distributor-products#onClickDeleteIcon"
                                >
                                        <i class="fa-solid fa-trash-can"></i>
                                    </a>
                            </div>
                        </div>';
                    }

                    $html .= '
                    <div id="distributor_products_pagination">'. $distributorProductsPagination .'</div>
                    <div 
                        class="modal fade" 
                        id="modal_product_delete" 
                        tabindex="-1" 
                        aria-labelledby="product_delete_label" 
                        aria-hidden="true"
                    >
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="product_delete_label">Delete Product</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="row">
                                        <div class="col-12 mb-0">
                                            Are you sure you would like to delete this product? This action cannot be undone.
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-primary btn-sm" data-bs-dismiss="modal">CANCEL</button>
                                    <button 
                                        type="submit" 
                                        class="btn btn-danger btn-sm" 
                                        id="delete_product"
                                        data-action="click->products--distributor-products#onClickDelete"
                                    >DELETE</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>';

        return new JsonResponse($html);
    }

    #[Route('/distributors/get/product', name: 'get_distributor_product')]
    public function getDistributorProductAction(Request $request): Response
    {
        $distributorId = $this->getUser()->getDistributor()->getId();
        $distributor = $this->em->getRepository(Distributors::class)->find($distributorId);
        $trackingId = $distributor->getTracking()->getId();
        $hidden = 'hidden';
        $apiClientId = $this->encryptor->decrypt($distributor->getApiDetails()->getClientId()) ?? '';
        $tracking = $this->em->getRepository(Tracking::class)->findAll();

        if($trackingId == 2)
        {
            $hidden = '';
        }

        $html = '
        <form name="form_inventory_item" id="form_inventory_item" method="post">
            <input type="hidden" id="product_id" name="distributor_products_form[product]" value="">
            <input type="hidden" id="distributor_id" name="distributor_products_form[distributor]" value="">
            <div class="row">
                <div class="col-12 text-center mt-1 pt-3 pb-3" id="order_header">
                    <h4 class="text-primary text-truncate">Inventory</h4>
                </div>
            </div>
    
            <!-- Semi Tracked -->
            <div class="row">
                <div class="col-12 '. $hidden .'" id="semi_tracked_row">';

                    if($distributor->getDistributorProducts()->count() > 0)
                    {
                        $html .= '
                        <a href="/distributors/download/inventory" class="float-end" id="download_inventory_csv">
                            <i class="fa-light fa-file-csv me-2"></i>
                            Export Products
                        </a>
                        <a
                            href=""
                            class="float-end me-4"
                            data-bs-toggle="modal"
                            data-bs-target="#modal_upload_file"
                            id="download_file"
                        >
                            <i class="fa-light fa-file-csv me-2"></i>
                            Upload Products
                        </a>';
                    }

                $html .= '
                </div>
            </div>';

            $hidden = 'hidden';

            if($trackingId == 1)
            {
                $hidden = '';
            }

            $html .= '
            <!-- Import Products From API -->
            <div class="row '. $hidden .'" id="import_products_row">
                <div class="col-12 w-100">
                    <a role="button" id="import_products" class="float-end text-primary">
                        <i class="fa-light fa-cloud-arrow-down me-2"></i>
                        Import Products
                    </a>
                </div>
            </div>
    
            <!-- Refresh Token -->
            <div class="row">
                <div 
                    class="col-12 pt-2 pb-2 bg-light border-left border-right border-bottom border-top" 
                    id="zoho_container" 
                    style="display: none"
                >
                    <a
                        href="https://accounts.zoho.com/oauth/v2/auth?scope=ZohoInventory.FullAccess.all&client_id='. $apiClientId .'&state=testing&response_type=code&redirect_uri='. $this->getParameter('app.base_url') .'/distributors/zoho/set/refresh-token&access_type=offline&prompt=consent"
                        class="btn btn-danger w-100"
                    >
                        Connect to Zoho Inventory
                    </a>
                </div>
            </div>
    
            <!-- Error -->
            <div class="row">
                <div 
                    class="col-12 pt-2 pb-2 bg-light border-left border-right border-bottom text-center pt-4 pb-4" 
                    id="zoho_error" 
                    style="display: none"
                >
                    Please contact admin with your app <b><i>CLIENT_ID</i></b> and <b><i>CLIENT_SECRET</i></b>
                </div>
            </div>
    
            <!-- Search -->
            <div class="row" id="search_row">
                <div class="col-12 col-sm-6 pt-2 pb-2 bg-light border-left border-top" id="inventory_search_container">
                    <div class="row">
                        <div class="col-12 search-div">
                            <input 
                                type="text" 
                                id="search_field" 
                                class="form-control" 
                                placeholder="Search Inventory" 
                                autocomplete="off" 
                                data-action="keyup->products--distributor-products#onKeyupSearchField"
                            />
                        </div>
                        <div class="col-1 clear-search hidden">
                            <a 
                                href="/distributors/manage-inventory" 
                                class="btn btn-secondary float-end btn-sm ms-sm-3 w-sm-100 mt-2 mt-sm-0" 
                                id="inventory_clear"
                            >
                                <i class="fa-solid fa-rotate-right"></i>
                            </a>
                        </div>
                    </div>
                    <div id="suggestion_field"></div>
                </div>
    
                <!-- Stock Tracking -->
                <div class="col-12 col-sm-6 pt-2 pb-2 bg-light border-right border-top">
                    <select class="form-control" name="tracking-id" id="tracking_id">
                        <option value="0">Select a Tracking Method</option>';

                        foreach($tracking as $track)
                        {
                            $selected = '';

                            if($distributor->getTracking()->getId() == $track->getId())
                            {
                                $selected = 'selected';
                            }

                            $html .= '
                            <option value="'. $track->getId() .'" '. $selected .'>
                                '. $track->getName() .'
                            </option>';
                        }

                    $html .= '
                    </select>
                </div>
            </div>
    
            <div id="inventory_item" class="row bg-light border-left border-right border-bottom">
                <div class="row mb-0 mb-sm-3 pe-0">
    
                    <!-- Dosage -->
                    <div class="col-12 col-sm-6 pe-0 pe-sm-2 pt-2">
                        <label>
                            Dosage
                        </label>
                        <input type="text" class="form-control" id="dosage" disabled value="">
                    </div>
    
                    <!-- Size -->
                    <div class="col-12 col-sm-6 pe-0 pt-2">
                        <label>
                            Size
                        </label>
                        <input type="text" class="form-control" id="size" disabled value="">
                    </div>
                </div>
    
                <div class="row mb-0 mb-sm-3 pe-0">
    
                    <!-- Active Ingredient -->
                    <div class="col-12 col-sm-6 pe-0 pe-sm-2 pt-2 pt-sm-0">
                        <label>
                            Active Ingredient
                        </label>
                        <input type="text" class="form-control" id="active_ingredient" disabled value="">
                    </div>
    
                    <!-- Unit -->
                    <div class="col-12 col-sm-6 pe-0 pe-sm-2 pt-2 pt-sm-0">
                        <label>
                            Unit
                        </label>
                        <input type="text" class="form-control" id="unit" disabled value="">
                    </div>
                </div>
    
                <div class="row mb-0 mb-sm-3 pe-0">
    
                    <!-- Item ID -->
                    <div class="col-12 col-sm-6 pe-0 pt-2 pt-sm-0">
                        <label>
                            Item ID
                        </label>
                        <input 
                            type="text" 
                            id="item_id" 
                            name="distributor_products_form[itemId]" 
                            class="form-control" 
                            placeholder="Your Item ID"
                        >
                        <div class="hidden_msg" id="error_item_id">
                            Required Field
                        </div>
                    </div>
    
                    <!-- SKU -->
                    <div class="col-12 col-sm-6 pe-0 pt-2 pt-sm-0">
                        <label>
                            #SKU
                        </label>
                        <input 
                            type="text" 
                            id="sku" 
                            name="distributor_products_form[sku]" 
                            class="form-control" 
                            placeholder="SKU"
                        >
                        <div class="hidden_msg" id="error_sku">
                            Required Field
                        </div>
                    </div>
                </div>
    
                <div class="row mb-0 mb-sm-3 pe-0" id="tracking_row">
    
                    <!-- Unit Price -->
                    <div class="col-12 col-sm-6 pe-0 pt-2 pt-sm-0">
                        <label>
                            Unit Price
                        </label>
                        <input 
                            type="text" 
                            id="unit_price" 
                            name="distributor_products_form[unitPrice]" 
                            class="form-control" 
                            placeholder="Unit Price"
                        >
                        <div class="hidden_msg" id="error_unit_price">
                            Required Field
                        </div>
                    </div>
    
                    <!-- Stock Level -->
                    <div class="col-12 col-sm-6 pe-0 pe-sm-2 pt-2 pt-sm-0">
                        <label>
                            Stock Level
                        </label>';

                        $disabled = '';

                        if($trackingId == 2 || $trackingId == 3)
                        {
                            $disabled = 'disabled';
                        }

                        $html .= '
                        <input 
                            type="number" 
                            id="stock_count" 
                            name="distributor_products_form[stockCount]" 
                            class="form-control" 
                            placeholder="Stock Level" 
                            '. $disabled .'
                        >
                        <div class="hidden_msg" id="error_stock_count">
                            Required Field
                        </div>
                    </div>
                </div>
    
                <div class="row mb-0 mb-sm-3 pe-0">
                    <!-- Tax Empt -->
                    <div class="col-12 pt-2 pt-sm-0">
                        <label class="d-block">
                            Tax Exempt
                        </label>
                        <div class="form-check form-check-inline radio-label">
                            <input 
                                type="radio" 
                                class="form-check-input" id="taxExempt_1" 
                                name="distributor_products_form[taxExempt]" 
                                value="1"
                            >
                            <label for="distributor_products_form_taxExempt_1" class="radio-text">Yes</label>
                        </div>
                        <div class="form-check form-check-inline radio-label">
                            <input 
                                type="radio" 
                                class="form-check-input" 
                                id="taxExempt_0" 
                                name="distributor_products_form[taxExempt]" 
                                value="0"
                            >
                            <label for="distributor_products_form_taxExempt_0" class="radio-text">No</label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mb-3" id="inventory_btn">
                <div class="col-12 mt-3 ps-0 pe-0">
                    <button id="btn_inventory" type="submit" class="btn btn-primary w-100"></button>
                </div>
            </div>
        </form>

        <!-- Modal Upload Products -->
        <div class="modal fade" id="modal_upload_file" tabindex="-1" aria-labelledby="modal_upload_file" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <form name="upload-csv" id="upload_csv" enctype="multipart/form-data" method="post">
                        <div class="modal-body">
                            <div class="row my-2">
                                <!-- File Upload -->
                                <div class="col-12">
                                    <input
                                        name="file"
                                        id="file"
                                        class="form-control"
                                        type="file"
                                    >
                                    <div class="hidden_msg" id="error_file">
                                        Required Field
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">CANCEL</button>
                            <button type="submit" class="btn btn-primary" id="btn_upload_file">SAVE</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>';

        return new JsonResponse($html);
    }

    public function zohoGetAllItems($organizationId, $accessToken, $page, $list)
    {
        $curl = curl_init();

        $orgId = $this->encryptor->decrypt($organizationId);

        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://inventory.zoho.com/api/v1/items?organization_id='. $orgId .'&page='. $page .'&per_page=200',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'GET',
            CURLOPT_HTTPHEADER => array(
                'Authorization: Zoho-oauthtoken '. $accessToken,
            ),
        ));

        $json = curl_exec($curl);
        $response = json_decode($json, true);

        curl_close($curl);

        if(array_key_exists('items', $response) && is_array($response['items']) && count($response['items']) > 0){

            foreach($response['items'] as $item){

                $stockOnHand = $item['stock_on_hand'] ?? 0;

                $list[] = [
                    'itemId' => $item['item_id'],
                    'itemName' => $item['item_name'],
                    'stockOnHand' => $stockOnHand,
                    'unitPrice' => $item['rate'],
                    'manufacturer' => $item['manufacturer'],
                    'weightUnit' => $item['weight_unit'],
                ];
            }
        }

        if($response['code'] == 0){

            if($response['page_context']['has_more_page']){

                $page = $page += 1;

                return $this->zohoGetAllItems($organizationId, $accessToken, $page, $list);

            } else {

                return $list;
            }
        }
    }

    public function zohoGetAccessToken($refreshToken, $distributorId): string
    {
        $apiDetails = $this->em->getRepository(ApiDetails::class)->findOneBy([
            'distributor' => $distributorId,
        ]);
        $curl = curl_init();
        $endpoint = 'https://accounts.zoho.com/oauth/v2/token?refresh_token=' . $refreshToken . '&';
        $endpoint .= 'client_id=' . $this->encryptor->decrypt($apiDetails->getClientId()) . '&';
        $endpoint .= 'client_secret=' . $this->encryptor->decrypt($apiDetails->getClientSecret()) . '&';
        $endpoint .= 'redirect_uri=https://fluid.vet/clinics/zoho/access-token&grant_type=refresh_token';

        curl_setopt_array($curl, [
            CURLOPT_URL => $endpoint,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST'
        ]);

        $json = curl_exec($curl);

        curl_close($curl);

        $response = json_decode($json, true);

        return $response['access_token'];
    }

    public function getPagination($pageId, $results, $distributorId)
    {
        $currentPage = (int)$pageId;
        $lastPage = $this->pageManager->lastPage($results);

        $pagination = '
        <!-- Pagination -->
        <div class="row mt-3">
            <div class="col-12">';

        if ($lastPage > 1)
        {
            $previousPageNo = $currentPage - 1;
            $url = '/distributors/users';
            $previousPage = $url . $previousPageNo;

            $pagination .= '
            <nav class="custom-pagination">
                <ul class="pagination justify-content-center">
            ';

            $disabled = 'disabled';
            $dataDisabled = 'true';

            // Previous Link
            if ($currentPage > 1)
            {
                $disabled = '';
                $dataDisabled = 'false';
            }

            $pagination .= '
            <li class="page-item ' . $disabled . '">
                <a 
                    class="user-pagination" 
                    aria-disabled="' . $dataDisabled . '" 
                    data-page-id="' . $currentPage - 1 . '" 
                    data-distributor-id="' . $distributorId . '"
                    href="' . $previousPage . '"
                    data-action="click->products--distributor-products#onClickPagination"
                >
                    <span aria-hidden="true">&laquo;</span> <span class="d-none d-sm-inline">Previous</span>
                </a>
            </li>';

            for ($i = 1; $i <= $lastPage; $i++)
            {
                $active = '';

                if ($i == (int)$currentPage)
                {
                    $active = 'active';
                    $pageId = '<input type="hidden" id="page_no" value="' . $currentPage . '">';
                }

                $pagination .= '
                <li class="page-item ' . $active . '">
                    <a 
                        class="user-pagination" 
                        data-page-id="' . $i . '" 
                        href="' . $url . '"
                        data-distributor-id="' . $distributorId . '"
                        data-action="click->products--distributor-products#onClickPagination"
                    >' . $i . '</a>
                </li>';
            }

            $disabled = 'disabled';
            $dataDisabled = 'true';

            if ($currentPage < $lastPage)
            {
                $disabled = '';
                $dataDisabled = 'false';
            }

            $pagination .= '
            <li class="page-item ' . $disabled . '">
                <a 
                    class="user-pagination" 
                    aria-disabled="' . $dataDisabled . '" 
                    data-page-id="' . $currentPage + 1 . '" 
                    href="' . $url . '"
                    data-distributor-id="' . $distributorId . '"
                    data-action="click->products--distributor-products#onClickPagination"
                >
                    <span class="d-none d-sm-inline">Next</span> <span aria-hidden="true">&raquo;</span>
                </a>
            </li>';

            $pagination .= '
                    </ul>
                </nav>';
        }

        $pagination .= '
            </div>
        </div>';

        return $pagination;
    }
}
